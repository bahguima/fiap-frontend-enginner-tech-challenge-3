FROM node:22.13-alpine AS dependencies

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci

COPY apps ./apps
COPY libs ./libs
COPY tools ./tools
COPY nx.json tsconfig.json tsconfig.base.json ./

FROM dependencies AS development

ENV NODE_ENV=development

EXPOSE 8101

CMD ["npm", "run", "dev:institutional"]

FROM dependencies AS build

ARG NEXT_PUBLIC_API_BASE_URL

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build:institutional

FROM nginx:1.27-alpine AS production

# CSP: origens permitidas além da própria (ver docker/nginx.conf). O
# envsubst da imagem oficial gera /etc/nginx/conf.d/default.conf na partida.
ENV CSP_REMOTE_ORIGINS=""
ENV CSP_API_ORIGIN=""

COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/apps/institutional/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:8080/healthz || exit 1

