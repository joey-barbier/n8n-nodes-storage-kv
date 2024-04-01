import {IExecuteFunctions, INodeExecutionData, INodeType, INodeTypeDescription,} from 'n8n-workflow';
import * as fs from 'fs';
import * as path from 'path';

export class KeyValueStorage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Key-Value Storage',
		name: 'keyValueStorage',
		group: ['transform'],
		version: 1,
		description: 'Stores and retrieves key-value pairs to/from a file.',
		defaults: {
			name: 'Key-Value Storage',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Save',
						value: 'save',
						description: 'Save a value for a specific key',
						action: 'Save a value for a specific key',
					},
					{
						name: 'Read',
						value: 'read',
						description: 'Read a value by key',
						action: 'Read a value by key',
					},
				],
				noDataExpression: true,
				default: 'save',
			},
			{
				displayName: 'File',
				name: 'fileName',
				type: 'string',
				default: '',
				placeholder: 'myFile',
				description: 'Name of file to save or play',
				required: true,
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				placeholder: 'exampleKey',
				description: 'The key for the value to save or read',
				required: true,
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				default: '',
				placeholder: 'exampleValue',
				description: 'The value to save. Required for save operation.',
				displayOptions: {
					show: {
						operation: [
							'save',
						],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;
		const fileName = this.getNodeParameter('fileName', 0) as string;
		const key: string = this.getNodeParameter('key', 0) as string;
		let items: {[k: string]: any} = {};

		if (operation === 'save') {
			const value = this.getNodeParameter('value', 0) as string;
			await saveValueToFile(key, value, fileName);
			items[key] = { value, operation, status: 'Saved' };
		} else if (operation === 'read') {
			items = {
				key,
				"value": await readValueFromFile(key, fileName),
				operation
			};
		}

		let result: INodeExecutionData[] = [];
		result.push({json: items})
		return [result];
	}
}

async function saveValueToFile(key: string, value: string, fileName: string): Promise<void> {
	const filePath = getPath(fileName)
	let data: { [key: string]: any } = {};
	if (fs.existsSync(filePath)) {
		data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
	}

	data[key] = value;
	fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');
}

async function readValueFromFile(key: string, fileName: string): Promise<any> {
	const filePath = getPath(fileName)
	if (fs.existsSync(filePath)) {
		const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
		return data[key] || null;
	}

	return null; // Key not found
}

function getPath(fileName: string): string {
	const folderPath = `${__dirname}/data/`;
	const filePath = path.join(folderPath, `${fileName}.json`);
	fs.promises.mkdir(folderPath, { recursive: true }).catch(console.error);

	return filePath
}
