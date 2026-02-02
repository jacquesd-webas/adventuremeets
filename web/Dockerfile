FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Install dependencies
COPY web/package.json web/pnpm-lock.yaml ./web/
WORKDIR /app/web
ARG VITE_API_BASEURL=http://localhost:3000
ENV VITE_API_BASEURL=${VITE_API_BASEURL}
RUN pnpm install --frozen-lockfile

# Copy sources and build
COPY web/. .
RUN pnpm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/web/dist /usr/share/nginx/html
COPY web/start.sh /start.sh
RUN chmod +x /start.sh
ENTRYPOINT ["/start.sh"]
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
