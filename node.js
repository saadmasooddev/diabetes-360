
const url = 'https://api.libreview.io/llu/auth/login';
const options = {
  method: 'POST',
  headers: {
    version: '4.7',
    product: 'llu.android',
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: 'Bearer 123'
  },
  body: '{"email":"","password":""}'
};

try {
  const response = await fetch(url, options);
  const data = await response.json();
  console.log(data);
} catch (error) {
  console.error(error);
}