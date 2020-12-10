FROM node:6.3

# Optional: nodemon gives you superpowers to automatically restart
# your server whenever a file changes:
RUN npm install -g nodemon forever

# Make directories to store the dependencies and the application code:

RUN mkdir -p /package
RUN mkdir -p /application
WORKDIR /application

# Set up the basics:

ENV PORT 80
EXPOSE 80

# Tell node where to find dependencies (they are not installed in the
# normal location

ENV NODE_PATH /package/node_modules

# Make incremental updates to the dependencies:

COPY package.json /package
RUN npm install --prefix /package

# Copy the application

COPY . /application

# By default, run the application with node:

CMD [ "npm", "start" ]