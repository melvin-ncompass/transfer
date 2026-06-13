const { ClickHouse } = require('clickhouse');

const client = new ClickHouse({
    url: 'http://localhost',
    port: 8123,
    debug: false,
    basicAuth: {
        username: 'default',
        password: 'Password',
    },
    isUseGzip: false,
    format: 'json',
});

async function test() {
    console.log('Testing ClickHouse connection with password...');
    try {
        const result = await client.query('SELECT 1').toPromise();
        console.log('Success:', result);
    } catch (err) {
        console.error('Error Message:', err.message);
    }
}

test();
