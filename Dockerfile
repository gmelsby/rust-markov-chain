FROM node:23-bookworm AS build


# Install Rustup and wasmpack
RUN apt-get update && apt install bash
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN npm i -g wasm-pack

# Copy markov_chain library
WORKDIR /usr/src/app/
COPY markov_chain/Cargo* ./markov_chain/
COPY markov_chain/src ./markov_chain/src

# Copy wasm library and webapp
WORKDIR /usr/src/app/markov_chain_wasm
COPY markov_chain_wasm/Cargo.* ./
COPY markov_chain_wasm/src ./src/
COPY markov_chain_wasm/www ./www/

# Build wasm libary
WORKDIR /usr/src/app/markov_chain_wasm
RUN wasm-pack build

# Install webapp dependencies
WORKDIR /usr/src/app/markov_chain_wasm/www
RUN npm ci

# Build webapp
WORKDIR /usr/src/app/markov_chain_wasm/www
RUN npm run build

FROM nginx:1.27.4
COPY markov_chain_wasm/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /usr/src/app/markov_chain_wasm/www/dist /www/client
COPY markov_chain_wasm/nginx/chains/ /www/chains/

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]