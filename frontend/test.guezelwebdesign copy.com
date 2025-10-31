server {
  listen 80;
  server_name test.guezelwebdesign.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name test.guezelwebdesign.com;

  ssl_certificate     /etc/letsencrypt/live/test.guezelwebdesign.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/test.guezelwebdesign.com/privkey.pem;

  client_max_body_size 50M;

  # --- Statik asset'lar doğrudan FE (dosya uzantısına göre) ---
  location ~* \.(?:html|js|mjs|css|map|png|jpe?g|webp|svg|gif|ico|woff2?|ttf|eot|txt|xml|json)$ {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header Accept-Language $normalized_lang;

    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # --- Tüm diğer istekler: Accept header'a göre yönlendir ---
  #     (HTML -> 8080, JSON/XHR -> 8081)
  location / {
    proxy_pass $route_upstream;       # map'ten geliyor (00_routing_maps.conf)
    proxy_http_version 1.1;

    proxy_set_header Host                $host;
    proxy_set_header X-Real-IP           $remote_addr;
    proxy_set_header X-Forwarded-For     $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto   $scheme;

    # Dil başlığını normalize edip BE'ye geç (FE için zararsız)
    proxy_set_header Accept-Language     $normalized_lang;
  }

  # Güvenlik (genel)
  location ~* \.(env|git|htaccess|htpasswd|log|bak|swp)$ { deny all; }
}
