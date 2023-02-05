# darwin-express

Simple express api to expose the `darwin-node` package.

## Notes on access
We'll use my access key for general requests, but user should optionally be able to auth with their own access key

We need to count requests being made as usage is free below the 'high volume' limit which is:
- 5 million enquiries, per user, per 28 day railway period
- 5000 per hour

## testing
firebase for registry and auth. How to test this in jest?

## Auth

New plan google auth is a pain for JWT stuff

1) on registry save user document in user collection
```
/users/{uuid}
{
    email: foo@bar.com
    hashedPassword: cbnuaduishnuai
    requests: 0
    darwinRequests: 0 
    createdAt: timestamp
    updatedAt: timestamp
}
```

2) on auth return a custom generated jwt with payload like
{
    aud: darwin-express
    sub: {user uuid}
    exp: some short-lived timestamp
}

3) on token revoke add entry like (auto TTL requires billing mind)
```
/tokens/{token string}
{
    revoked: timestamp
    payload: { ...above payload... }
}
```

## endpoints

- `POST /register` (unprotected)
- `POST /auth` (unprotected)
- `POST /refresh`
- `POST /revoke`
- `GET /arrivalsAndDepartures/{csr}/to|from/{filterCsr}`
- `GET /serviceDetails/{serviceId}`