const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { GetItemCommand } = require('@aws-sdk/client-dynamodb');

// Initialiseer de DynamoDB client met credentials aanpassingen
const client = new DynamoDBClient({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,        // Als je .env gebruikt
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY  // Als je .env gebruikt
    }
});

// Configureer de DocumentClient met native marshalling
const docClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: true,
    }
});

// Herbruikbare functies voor database operaties
async function createItem(tableName, item) {
    const command = new PutCommand({
        TableName: tableName,
        Item: item,
    });
    return docClient.send(command);
}

async function getItem(tableName, id) {
    try {
        const command = new GetItemCommand({
            TableName: tableName,
            Key: {
                'id': { S: id.toString() }
            }
        });
        
        const response = await client.send(command);
        console.log('Existing item:', JSON.stringify(response.Item, null, 2));
        return response.Item;
    } catch (error) {
        console.error('Error getting item:', error);
        throw error;
    }
}

async function queryItems(tableName, keyCondition, expressionValues, indexName = null) {
    const command = new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: keyCondition,
        ExpressionAttributeValues: expressionValues,
        IndexName: indexName  // Deze parameter zorgt ervoor dat de GSI wordt gebruikt
    });
    return docClient.send(command);
}

async function deleteItem(tableName, key) {
    const command = new DeleteCommand({
        TableName: tableName,
        Key: key,
    });
    return docClient.send(command);
}

async function updateItem(tableName, id, updates) {
    try {
        // Gebruik de huidige datum als RANGE key als we geen specifieke datum hebben
        const currentDate = new Date().toISOString().split('T')[0];  // Format: YYYY-MM-DD
        
        const command = new UpdateCommand({
            TableName: tableName,
            Key: {
                id: id.toString(),        // HASH key
                date: currentDate         // RANGE key
            },
            UpdateExpression: 'SET ' + Object.keys(updates)
                .map((key, index) => `#${key} = :value${index}`)
                .join(', '),
            ExpressionAttributeNames: Object.keys(updates)
                .reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {}),
            ExpressionAttributeValues: Object.values(updates)
                .reduce((acc, value, index) => ({ ...acc, [`:value${index}`]: value }), {})
        });

        console.log('Update command:', {
            tableName,
            key: command.input.Key,
            updateExpression: command.input.UpdateExpression
        });

        return await docClient.send(command);
    } catch (error) {
        console.error('Update failed:', {
            error: error.message,
            tableName,
            id,
            updates
        });
        throw error;
    }
}

async function putItem(tableName, item) {
    try {
        console.log('Starting DB operation:', {
            operation: 'putItem',
            tableName,
            itemId: item.id,
            timestamp: new Date().toISOString()
        });

        const command = new PutCommand({
            TableName: tableName,
            Item: {
                ...item,
                id: item.id.toString(),
                date: item.date.toString()
            }
        });

        const result = await docClient.send(command).catch(error => {
            console.error('DynamoDB Error:', {
                error: error.message,
                tableName,
                itemId: item.id,
                errorCode: error.code,
                stack: error.stack
            });
            throw error;
        });

        console.log('DB operation completed:', {
            operation: 'putItem',
            tableName,
            itemId: item.id,
            timestamp: new Date().toISOString()
        });

        return result;

    } catch (error) {
        console.error('Database operation failed:', {
            error: error.message,
            tableName,
            itemId: item.id,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
}

// Voeg deze debug functie toe
async function debugTableStructure(tableName) {
    try {
        // Haal een willekeurig item op
        const command = new QueryCommand({
            TableName: tableName,
            Limit: 1
        });
        
        const result = await docClient.send(command);
        console.log('Table structure debug:', {
            items: result.Items,
            count: result.Count,
            schema: result.TableDescription
        });
    } catch (error) {
        console.error('Debug query failed:', error);
    }
}

module.exports = {
    createItem,
    getItem,
    queryItems,
    deleteItem,
    updateItem,
    putItem,
    debugTableStructure
};