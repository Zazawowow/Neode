# Neode Deployment Troubleshooting

## 502 Bad Gateway Error

If you're seeing a **502 Bad Gateway** error from openresty, try these steps:

### 1. Check Build Logs in Portainer

Look for these messages in the build output:
```
Build complete. Listing dist contents:
✓ index.html found
✓ index.html present
```

If you see "✗ index.html NOT found", the Vite build failed.

### 2. Verify Container is Running

```bash
docker ps | grep neode-web
```

### 3. Check Nginx Logs

```bash
# Access logs
docker logs neode-web

# Or exec into container
docker exec -it neode-web sh
ls -la /usr/share/nginx/html/
cat /var/log/nginx/error.log
```

### 4. Test Health Endpoint

```bash
curl http://localhost:8100/health
# Should return: healthy
```

### 5. Manual Build Test (Local)

Test the Docker build locally:

```bash
cd /path/to/Neode
docker build -t neode-test .
docker run -p 8100:80 neode-test
```

Then visit `http://localhost:8100`

### 6. Common Issues

#### Issue: Build fails with "Cannot find module"
**Solution:** Delete `node_modules` and rebuild:
```bash
# In Portainer, rebuild the stack from scratch
# Or locally:
rm -rf neode-ui/node_modules
docker build --no-cache -t neode-test .
```

#### Issue: OpenResty instead of Nginx
**Solution:** Make sure you're using the official `nginx:alpine` image, not a custom one.

Check your `docker-compose.yml`:
```yaml
services:
  neode-web:
    build:
      context: https://github.com/Zazawowow/Neode.git
      dockerfile: Dockerfile
```

#### Issue: Files not copied to nginx
**Solution:** Check the build output for the verification steps.

#### Issue: Vue Router returns 404
**Solution:** Make sure `nginx.conf` has the SPA fallback:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 7. Quick Fix: Use Simple Test

Create a test endpoint to verify nginx is running:

```bash
# Exec into container
docker exec -it neode-web sh

# Create test file
echo '<h1>Nginx is working!</h1>' > /usr/share/nginx/html/test.html

# Visit: http://localhost:8100/test.html
```

If this works, the problem is with the Vue build, not nginx.

### 8. Alternative: Serve from Different Directory

If the issue persists, try serving from a different path:

Update `Dockerfile`:
```dockerfile
COPY --from=builder /app/dist /usr/share/nginx/html/app
```

Update `nginx.conf`:
```nginx
root /usr/share/nginx/html/app;
```

## Need More Help?

Check the build logs in Portainer for specific error messages.
The debug output added to the Dockerfile will show:
1. What files were built
2. What files were copied to nginx
3. Whether index.html exists

