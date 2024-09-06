# outlook-integration

### Clone this repository into your system and move to the root of the project.

### Build docker image of the server
```bash
docker build . -t nodeapp
```

### Run application using docker compose
```bash
docker compose up -d
```

## If you run into any problem then kill the docker instance and follow the bellow steps.
1. Run below command to provide permission to `es_data` folder
```bash
sudo chmod 777 es_data
```

2. After the above command is executed. Run the application again by executing below command
```bash
docker compose up -d
```

### You should be able to access the home page at [localhost:3000](http://localhost:3000)

## Do the following setup for environment variables before image creation.

Create a `.env` file and add following config values:
```bash
ENDPOINT = "http://elastic-search:9200"

SECRET_KEY = "secret_key"
JWT_PRIVATE_KEY = "JWT_PRIVATE_KEY"

# MICROSOFT OUTLOOK CONFIG
CLIENT_ID = "APP_REGISTRATION_CLIENT_ID"
CLIENT_SECRET = "APP_REGISTRATION_SECRET_KEY"
REDIRECT_URI = "http://localhost:3000/auth/microsoft/callback"
```

## NOTE: Microsoft App Registration service permissions required for the application to work as expected:
1. email
2. Mail.Read
3. Mail.ReadBasic
4. Mail.ReadWrite
5. Mail.Send
6. offline_access
7. openid
8. profile
9. User.Read
