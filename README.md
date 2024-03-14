# auth_JWT_2FA

JWT Auth flow

`nvm use`

## Server:

`cd nest-auth-server && npm i`

then run the server: `npm run start:dev`

run `mailhog` and open in the browser `[HTTP] Binding to address` url to test the reset password and mail delivery

to test server api use the postman collection and set `{{host}}` , `{{accessToken}}` variables

## Client:

`cd nest-auth-client && npm i`

`npm run dev -- --open`
