FROM node:20-alpine AS builder
WORKDIR /app

COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/tsconfig.json
COPY packages/shared/src packages/shared/src

COPY web/package.json web/
COPY web/vite.config.ts web/vite.config.ts
COPY web/tsconfig.json web/tsconfig.json
COPY web/tsconfig.node.json web/tsconfig.node.json
COPY web/vitest.setup.ts web/vitest.setup.ts
COPY web/index.html web/index.html
COPY web/src web/src

WORKDIR /app/web
ARG VITE_API_BASEURL=http://localhost:3000
ENV VITE_API_BASEURL=${VITE_API_BASEURL}
RUN npm install
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
