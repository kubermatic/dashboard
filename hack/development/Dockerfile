FROM node:14

# Set environment variable for terminal
ENV TERM=xterm

# Create app working directory
VOLUME dashboard
WORKDIR dashboard

# Install app dependencies
COPY package*.json ./
RUN ["mkdir","-p","cypress/plugins"]
RUN npm ci

# Pre-compile angular dependencies
RUN npx ngcc

# Bundle app sources
COPY . .

# Run npm command in container.
CMD ${K8C_DASHBOARD_NPM_CMD}
