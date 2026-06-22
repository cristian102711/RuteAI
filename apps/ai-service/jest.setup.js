// Evita que el app haga app.listen() durante los tests (el guard usa NODE_ENV).
process.env.NODE_ENV = "production";
