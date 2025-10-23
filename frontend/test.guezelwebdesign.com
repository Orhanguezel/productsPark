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

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 50M;

    # 1) Next.js statikleri (tarifintarifi)
    location /_next/static/ {
        alias /var/www/tarifintarifi/frontend/.next/static/;
        access_log off;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 2) Kökteki tekil public dosyalar
    location ~* ^/(favicon\.ico|robots\.txt|placeholder\.jpg)$ {
        alias /var/www/tarifintarifi/frontend/public/$1;
        access_log off;
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # 3) Diğer public asset klasörleri
    location ~* ^/(defaults|uploads|assets|public)/ {
        alias /var/www/tarifintarifi/frontend/public/;
        access_log off;
        expires 30d;
        add_header Cache-Control "public";
        try_files $uri =404;
    }

    # 4) API -> tarifintarifi-backend (PM2’de 5033)
    location /api/ {
        proxy_pass http://127.0.0.1:5033;   # trailing slash YOK → /api/... upstream'a aynen gider
        proxy_http_version 1.1;
        proxy_set_header Host                $host;
        proxy_set_header X-Real-IP           $remote_addr;
        proxy_set_header X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto   $scheme;
        proxy_read_timeout 90s;
    }

    # 5) (Varsa) Ollama yönlendirmesi
    location /ollama/ {
        rewrite ^/ollama/(.*)$ /$1 break;
        proxy_pass http://127.0.0.1:11434/;
        proxy_http_version 1.1;
        proxy_set_header Host      $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 6) Güvenlik
    location ~* \.(env|git|htaccess|htpasswd|log|bak|swp)$ {
        deny all;
    }

    # 7) Diğer her şey → Next.js app server (PM2) :3012
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host                $host;
        proxy_set_header X-Real-IP           $remote_addr;
        proxy_set_header X-Forwarded-For     $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto   $scheme;

        # WebSocket/stream uyumu
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
    }

    error_page 404 /;
}
