# Backend configuration

This backend reads `JWT_SECRET` from environment variables.

Create a `.env` file in the `backend` folder (or set env vars in your process) with:

```
JWT_SECRET=your_secure_secret_here
```

If no `JWT_SECRET` is provided the default `yourjwttoken` will be used (not secure). For production always set a strong secret.
