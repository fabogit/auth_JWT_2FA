# Auth & 2FA

Auth flow using access and refresh token, 2fa on the `2fa` branch

`nvm use`

start the db container `docker-compose up` and `mailhog`

## Server:

`cd nest-auth-server && npm i`

then run the server: `npm run start:dev`

run `mailhog` and open in the browser (check `Serving under ...` for url) to test the reset password and mail delivery

to test server api use the postman collection and set `{{host}}` , `{{accessToken}}` variables

## Client:

`cd nest-auth-client && npm i`

`npm run dev -- --open`
