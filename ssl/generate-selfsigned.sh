#!/bin/bash
# 生成自签名证书（仅用于测试）
# 生产环境请使用 Let's Encrypt 或受信任的 CA

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem \
    -out ssl/fullchain.pem \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Dev/CN=localhost"

echo "自签名证书已生成: ssl/"
echo "警告: 仅供测试使用，浏览器会显示安全警告"
