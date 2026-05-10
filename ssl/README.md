# SSL 证书

## 测试环境（自签名）

```bash
bash ssl/generate-selfsigned.sh
```

浏览器会显示安全警告，仅用于本地测试。

## 生产环境（Let's Encrypt）

1. 确保域名 DNS 指向服务器
2. 安装 certbot: `apt install certbot` (Ubuntu/Debian)
3. 停止 nginx: `docker compose stop nginx`
4. 获取证书:
   ```
   certbot certonly --standalone -d your-domain.com
   ```
5. 复制证书:
   ```
   cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
   cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
   ```
6. 取消 nginx.conf 中 HTTPS server block 的注释
7. 启动 nginx: `docker compose --profile production up -d nginx`
8. 设置自动续期:
   ```
   certbot renew --pre-hook "docker compose stop nginx" \
                 --post-hook "docker compose --profile production start nginx"
   ```
