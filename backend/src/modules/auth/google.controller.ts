// =============================================================
// FILE: src/modules/auth/google.controller.ts
// =============================================================
import type {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
} from "fastify";
import { randomUUID } from "crypto";
import { db } from "@/db/client";
import { users } from "./schema";
import { userRoles } from "@/modules/userRoles/schema";
import { getPrimaryRole } from "@/modules/userRoles/service";
import { eq } from "drizzle-orm";
import {
  OAuth2Client,
  type TokenPayload,
} from "google-auth-library";
import { googleBody } from "./validation";
import { getGoogleSettings } from "@/modules/siteSettings/service";
import {
  ensureProfileRow,
  issueTokens,
  setAccessCookie,
  setRefreshCookie,
  parseAdminEmailAllowlist,
  baseUrlFrom,
  frontendRedirectDefault,
} from "./controller";
import { hash as argonHash } from "argon2";

export function makeGoogleAuthController(app: FastifyInstance) {
  const adminEmails = parseAdminEmailAllowlist();

  async function upsertGoogleUser(payload: TokenPayload) {
    const email = payload.email;
    if (!email) {
      throw new Error("google_email_required");
    }

    const emailVerified = (payload.email_verified
      ? 1
      : 0) as 0 | 1;
    const fullName = payload.name ?? undefined;

    let u = (
      await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)
    )[0];

    if (!u) {
      const id = randomUUID();
      const password_hash = await argonHash(randomUUID());

      await db.insert(users).values({
        id,
        email,
        password_hash,
        full_name: fullName,
        email_verified: emailVerified,
        is_active: 1,
      });

      const isAdmin = adminEmails.has(email.toLowerCase());
      await db.insert(userRoles).values({
        id: randomUUID(),
        user_id: id,
        role: isAdmin ? "admin" : "user",
      });

      await ensureProfileRow(id, {
        full_name: fullName ?? null,
      });
      u = (
        await db
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1)
      )[0]!;
    } else {
      await db
        .update(users)
        .set({
          email_verified: emailVerified ? 1 : u.email_verified,
          last_sign_in_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(users.id, u.id));

      await ensureProfileRow(u.id, {
        full_name: fullName ?? null,
      });
    }

    return { user: u, emailVerified };
  }

  return {
    /* ------------------------------ GOOGLE (ID token) ------------------------------ */
    // POST /auth/google  (FE: Supabase tarzı → id_token gönderiyor)
    google: async (req: FastifyRequest, reply: FastifyReply) => {
      const parsed = googleBody.safeParse(req.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: { message: "invalid_body" } });
      }

      const { id_token } = parsed.data;

      const { clientId } = await getGoogleSettings();
      if (!clientId) {
        return reply.status(500).send({
          error: { message: "google_oauth_not_configured" },
        });
      }

      let payload: TokenPayload | null = null;
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken: id_token,
          audience: clientId,
        });
        payload = ticket.getPayload() ?? null;
      } catch (err) {
        req.log.error(
          { err },
          "google_verify_failed_id_token",
        );
        return reply
          .status(401)
          .send({ error: { message: "invalid_google_token" } });
      }

      if (!payload || !payload.email) {
        return reply.status(400).send({
          error: { message: "google_email_required" },
        });
      }

      const { user, emailVerified } = await upsertGoogleUser(
        payload,
      );
      const role = await getPrimaryRole(user.id);
      const { access, refresh } = await issueTokens(
        app,
        user,
        role,
      );

      setAccessCookie(reply, access);
      setRefreshCookie(reply, refresh);

      return reply.send({
        access_token: access,
        token_type: "bearer",
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name ?? null,
          phone: user.phone ?? null,
          email_verified: emailVerified ? 1 : user.email_verified,
          is_active: user.is_active,
          role,
        },
      });
    },

    /* ------------------------------ GOOGLE REDIRECT START ------------------------------ */
    // POST /auth/google/start
    googleStart: async (
      req: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const body = (req.body ?? {}) as Record<
        string,
        unknown
      >;
      const redirectTo =
        typeof body["redirectTo"] === "string"
          ? (body["redirectTo"] as string)
          : undefined;

      const { clientId, clientSecret } = await getGoogleSettings();
      if (!clientId || !clientSecret) {
        return reply.status(500).send({
          error: { message: "google_oauth_not_configured" },
        });
      }

      const base = baseUrlFrom(req);
      const redirectUri = `${base}/auth/google/callback`;
      const csrf = randomUUID();

      const u = new URL(
        "https://accounts.google.com/o/oauth2/v2/auth",
      );
      const statePayload = {
        r: redirectTo || frontendRedirectDefault(),
        c: csrf,
      };
      const state = Buffer.from(
        JSON.stringify(statePayload),
      ).toString("base64url");

      u.searchParams.set("client_id", clientId);
      u.searchParams.set("redirect_uri", redirectUri);
      u.searchParams.set("response_type", "code");
      u.searchParams.set("scope", "openid email profile");
      u.searchParams.set("include_granted_scopes", "true");
      u.searchParams.set("prompt", "select_account");
      u.searchParams.set("state", state);

      reply.setCookie("g_csrf", csrf, {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 10,
      });

      return reply.send({ url: u.toString() });
    },

    /* ------------------------------ GOOGLE REDIRECT CALLBACK ------------------------------ */
    // GET /auth/google/callback
    googleCallback: async (
      req: FastifyRequest,
      reply: FastifyReply,
    ) => {
      const defaultRedirect = frontendRedirectDefault();

      try {
        const query = (req.query ?? {}) as Record<
          string,
          string | undefined
        >;
        const code = query["code"];
        const stateRaw = query["state"];

        if (!code || !stateRaw) {
          return reply
            .status(302)
            .header("location", defaultRedirect)
            .send();
        }

        const cookies = (req.cookies ?? {}) as Record<
          string,
          string | undefined
        >;
        const csrfCookie = cookies["g_csrf"];

        let state: { r?: string; c?: string } = {};
        try {
          state = JSON.parse(
            Buffer.from(stateRaw, "base64url").toString(
              "utf8",
            ),
          );
        } catch {
          // parse error -> state boş kalsın
        }

        if (!csrfCookie || !state.c || state.c !== csrfCookie) {
          return reply
            .status(302)
            .header(
              "location",
              `${defaultRedirect}?error=csrf`,
            )
            .send();
        }

        const { clientId, clientSecret } =
          await getGoogleSettings();
        if (!clientId || !clientSecret) {
          return reply
            .status(302)
            .header(
              "location",
              `${defaultRedirect}?error=not_configured`,
            )
            .send();
        }

        const base = baseUrlFrom(req);
        const redirectUri = `${base}/auth/google/callback`;

        const client = new OAuth2Client(
          clientId,
          clientSecret,
          redirectUri,
        );

        const { tokens } = await client.getToken(code);
        const idToken = tokens.id_token;

        if (!idToken) {
          return reply
            .status(302)
            .header(
              "location",
              `${defaultRedirect}?error=no_id_token`,
            )
            .send();
        }

        const ticket = await client.verifyIdToken({
          idToken,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
          return reply
            .status(302)
            .header(
              "location",
              `${defaultRedirect}?error=no_email`,
            )
            .send();
        }

        const { user } = await upsertGoogleUser(payload);
        const role = await getPrimaryRole(user.id);
        const { access, refresh } = await issueTokens(
          app,
          user,
          role,
        );

        setAccessCookie(reply, access);
        setRefreshCookie(reply, refresh);

        const redirectTo = state.r || defaultRedirect;
        return reply
          .clearCookie("g_csrf", { path: "/" })
          .status(302)
          .header("location", redirectTo)
          .send();
      } catch (err) {
        req.log.error(
          { err },
          "google_callback_failed_unexpected",
        );
        return reply
          .status(302)
          .header(
            "location",
            `${defaultRedirect}?error=callback_failed`,
          )
          .send();
      }
    },
  };
}
