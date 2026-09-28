export type DbConfigType = {
  username: string;
  host: string;
  password: string;
  database: string;
  port: number;
};

export default () => ({
  database: {
    username: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || ''),
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
  } as DbConfigType,
  salt: parseInt(process.env.HASHING_SALT || '0'),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  refreshTokenExpireIn: '7d',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:4200'],
});
