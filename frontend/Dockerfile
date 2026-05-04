# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]









# FROM node:20-alpine AS builder

#WORKDIR /app
#COPY package*.json ./
#RUN npm install

#COPY . .
#RUN npm run build


#FROM nginx:alpine
#COPY --from=builder /app/dist /usr/share/nginx/html

#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
