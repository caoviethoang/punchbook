# syntax=docker/dockerfile:1
ARG RUBY_VERSION=3.3.10
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

WORKDIR /app

# Install base packages
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libpq-dev postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Build stage
FROM base AS build

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Install application gems
COPY Gemfile Gemfile.lock ./
RUN bundle install

# Final image
FROM base

# Dev compose mounts Gemfile + bundle volume and runs bundle install at runtime,
# so native gems (bcrypt/devise) need a compiler toolchain here too.
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built gems
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /app /app

# Copy application code
COPY . .

# Run and preprocess script
EXPOSE 3000
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0"]
