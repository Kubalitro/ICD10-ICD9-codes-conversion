console.log('Test script running...');
if (process.env.DATABASE_URL) {
    console.log('DATABASE_URL is set in child process.');
} else {
    console.error('DATABASE_URL is NOT set in child process.');
}
