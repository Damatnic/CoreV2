/**
 * Health Check Endpoint
 * Simple endpoint to verify Netlify Functions are running
 */

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'healthy',
      message: 'Netlify Functions are running',
      timestamp: new Date().toISOString()
    })
  };
};