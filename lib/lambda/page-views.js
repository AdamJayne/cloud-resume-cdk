const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });

let docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  let data;
  let response = {
    headers: {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "https://resume.adamljayne.com",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
  };

  try {
    // Update the field in the table by incrementing by 1
    data = await docClient
      .update({
        TableName: "test-table",
        Key: {
          id: "resumeviews",
        },
        UpdateExpression: "SET PageViews = PageViews + :v",
        ExpressionAttributeValues: {
          ":v": 1,
        },
        ReturnValues: "ALL_NEW",
      })
      .promise();

    response = {
      ...response,
      statusCode: 200,
      body: JSON.stringify({ views: data.Attributes.PageViews }),
    };
  } catch (e) {
    // If the field has not been created yet
    if (e.code === "ValidationException") {
      try {
        // Create the item in the table
        await docClient
          .put({
            TableName: "test-table",
            Item: {
              id: "resumeviews",
              PageViews: 1,
            },
          })
          .promise();

        response = {
          ...response,
          statusCode: 200,
          body: JSON.stringify({ views: 1 }),
        };
      } catch (e2) {
        response = {
          ...response,
          statusCode: 500,
          body: JSON.stringify({ message: e2 }),
        };
      }
    } else {
      response = {
        ...response,
        statusCode: 500,
        body: JSON.stringify({ message: e }),
      };
    }
  }

  return response;
};
