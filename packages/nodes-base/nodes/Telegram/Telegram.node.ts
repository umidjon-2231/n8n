import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';
import {
	BINARY_ENCODING,
	SEND_AND_WAIT_OPERATION,
	NodeConnectionTypes,
	NodeOperationError,
} from 'n8n-workflow';
import type { Readable } from 'stream';

import {
	addAdditionalFields,
	apiRequest,
	createSendAndWaitMessageBody,
	getPropertyName,
} from './GenericFunctions';
import { appendAttributionOption } from '../../utils/descriptions';
import { configureWaitTillDate } from '../../utils/sendAndWait/configureWaitTillDate.util';
import { sendAndWaitWebhooksDescription } from '../../utils/sendAndWait/descriptions';
import { getSendAndWaitProperties, sendAndWaitWebhook } from '../../utils/sendAndWait/utils';

export class Telegram implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Telegram',
		name: 'telegram',
		icon: 'file:telegram.svg',
		group: ['output'],
		version: [1, 1.1, 1.2],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Sends data to Telegram',
		defaults: {
			name: 'Telegram',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'telegramApi',
				required: true,
			},
		],
		webhooks: sendAndWaitWebhooksDescription,
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					// {
					// 	name: 'Bot',
					// 	value: 'bot',
					// },
					{
						name: 'Chat',
						value: 'chat',
					},
					{
						name: 'Callback',
						value: 'callback',
					},
					{
						name: 'File',
						value: 'file',
					},
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
			},

			// ----------------------------------
			//         operation
			// ----------------------------------

			// {
			// 	displayName: 'Operation',
			// 	name: 'operation',
			// 	type: 'options',
			// 	displayOptions: {
			// 		show: {
			// 			resource: [
			// 				'bot',
			// 			],
			// 		},
			// 	},
			// 	options: [
			// 		{
			// 			name: 'Info',
			// 			value: 'info',
			// 			description: 'Get information about the bot associated with the access token.',
			// 		},
			// 	],
			// 	default: 'info',
			// 	description: 'The operation to perform.',
			// },

			// ----------------------------------
			//         operation
			// ----------------------------------

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get up to date information about a chat',
						action: 'Get a chat',
					},
					{
						name: 'Get Administrators',
						value: 'administrators',
						description: 'Get the Administrators of a chat',
						action: 'Get all administrators in a chat',
					},
					{
						name: 'Get Member',
						value: 'member',
						description: 'Get the member of a chat',
						action: 'Get a member in a chat',
					},
					{
						name: 'Leave',
						value: 'leave',
						description: 'Leave a group, supergroup or channel',
						action: 'Leave a chat',
					},
					{
						name: 'Set Description',
						value: 'setDescription',
						description: 'Set the description of a chat',
						action: 'Set description on a chat',
					},
					{
						name: 'Set Title',
						value: 'setTitle',
						description: 'Set the title of a chat',
						action: 'Set a title on a chat',
					},
				],
				default: 'get',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['callback'],
					},
				},
				options: [
					{
						name: 'Answer Query',
						value: 'answerQuery',
						description: 'Send answer to callback query sent from inline keyboard',
						action: 'Answer Query a callback',
					},
					{
						name: 'Answer Inline Query',
						value: 'answerInlineQuery',
						description: 'Send answer to callback query sent from inline bot',
						action: 'Answer an inline query callback',
					},
				],
				default: 'answerQuery',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['file'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						description: 'Get a file',
						action: 'Get a file',
					},
				],
				default: 'get',
			},

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Delete Chat Message',
						value: 'deleteMessage',
						description: 'Delete a chat message',
						action: 'Delete a chat message',
					},
					{
						name: 'Edit Message Text',
						value: 'editMessageText',
						description: 'Edit a text message',
						action: 'Edit a text message',
					},
					{
						name: 'Pin Chat Message',
						value: 'pinChatMessage',
						description: 'Pin a chat message',
						action: 'Pin a chat message',
					},
					{
						name: 'Send Animation',
						value: 'sendAnimation',
						description: 'Send an animated file',
						action: 'Send an animated file',
					},
					{
						name: 'Send Audio',
						value: 'sendAudio',
						description: 'Send a audio file',
						action: 'Send an audio file',
					},
					{
						name: 'Send Chat Action',
						value: 'sendChatAction',
						description: 'Send a chat action',
						action: 'Send a chat action',
					},
					{
						name: 'Send Contact',
						value: 'sendContact',
						description: 'Send a contact',
						action: 'Send a contact',
					},
					{
						name: 'Send Document',
						value: 'sendDocument',
						description: 'Send a document',
						action: 'Send a document',
					},
					{
						name: 'Send Location',
						value: 'sendLocation',
						description: 'Send a location',
						action: 'Send a location',
					},
					{
						name: 'Send Media Group',
						value: 'sendMediaGroup',
						description: 'Send group of photos or videos to album',
						action: 'Send a media group message',
					},
					{
						name: 'Send Message',
						value: 'sendMessage',
						description: 'Send a text message',
						action: 'Send a text message',
					},
					{
						name: 'Send and Wait for Response',
						value: SEND_AND_WAIT_OPERATION,
						description: 'Send a message and wait for response',
						action: 'Send message and wait for response',
					},
					{
						name: 'Send Photo',
						value: 'sendPhoto',
						description: 'Send a photo',
						action: 'Send a photo message',
					},
					{
						name: 'Send Poll',
						value: 'sendPoll',
						description: 'Send a poll',
						action: 'Send a poll',
					},
					{
						name: 'Send Sticker',
						value: 'sendSticker',
						description: 'Send a sticker',
						action: 'Send a sticker',
					},
					{
						name: 'Send Video',
						value: 'sendVideo',
						description: 'Send a video',
						action: 'Send a video',
					},
					{
						name: 'Unpin Chat Message',
						value: 'unpinChatMessage',
						description: 'Unpin a chat message',
						action: 'Unpin a chat message',
					},
				],
				default: 'sendMessage',
			},

			// ----------------------------------
			//         chat / message
			// ----------------------------------

			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: [
							'administrators',
							'deleteMessage',
							'get',
							'leave',
							'member',
							'pinChatMessage',
							'setDescription',
							'setTitle',
							'sendAnimation',
							'sendAudio',
							'sendChatAction',
							'sendContact',
							'sendDocument',
							'sendLocation',
							'sendMessage',
							'sendMediaGroup',
							'sendPhoto',
							'sendPoll',
							'sendSticker',
							'sendVideo',
							'unpinChatMessage',
						],
						resource: ['chat', 'message'],
					},
				},
				required: true,
				description:
					'Unique identifier for the target chat or username, To find your chat ID ask @get_id_bot',
			},

			// ----------------------------------
			//       message:deleteMessage
			// ----------------------------------
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['deleteMessage'],
						resource: ['message'],
					},
				},
				required: true,
				description: 'Unique identifier of the message to delete',
			},

			// ----------------------------------
			//       message:pinChatMessage
			// ----------------------------------
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['pinChatMessage', 'unpinChatMessage'],
						resource: ['message'],
					},
				},
				required: true,
				description: 'Unique identifier of the message to pin or unpin',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['pinChatMessage'],
						resource: ['message'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						description:
							'Whether to send a notification to all chat members about the new pinned message',
					},
				],
			},

			// ----------------------------------
			//         chat
			// ----------------------------------

			// ----------------------------------
			//         chat:member
			// ----------------------------------
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['member'],
						resource: ['chat'],
					},
				},
				required: true,
				description: 'Unique identifier of the target user',
			},

			// ----------------------------------
			//         chat:setDescription
			// ----------------------------------
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['setDescription'],
						resource: ['chat'],
					},
				},
				required: true,
				description: 'New chat description, 0-255 characters',
			},

			// ----------------------------------
			//         chat:setTitle
			// ----------------------------------
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['setTitle'],
						resource: ['chat'],
					},
				},
				required: true,
				description: 'New chat title, 1-255 characters',
			},

			// ----------------------------------
			//         callback
			// ----------------------------------

			// ----------------------------------
			//         callback:answerQuery
			// ----------------------------------
			{
				displayName: 'Query ID',
				name: 'queryId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['answerQuery'],
						resource: ['callback'],
					},
				},
				required: true,
				description: 'Unique identifier for the query to be answered',
			},

			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['answerQuery'],
						resource: ['callback'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Cache Time',
						name: 'cache_time',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'The maximum amount of time in seconds that the result of the callback query may be cached client-side',
					},
					{
						displayName: 'Show Alert',
						name: 'show_alert',
						type: 'boolean',
						default: false,
						description:
							'Whether an alert will be shown by the client instead of a notification at the top of the chat screen',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description:
							'Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters.',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: "URL that will be opened by the user's client",
					},
				],
			},

			// -----------------------------------------------
			//         callback:answerInlineQuery
			// -----------------------------------------------
			{
				displayName: 'Query ID',
				name: 'queryId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
						resource: ['callback'],
					},
				},
				required: true,
				description: 'Unique identifier for the answered query',
			},
			{
				displayName: 'Results',
				name: 'results',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
						resource: ['callback'],
					},
				},
				required: true,
				description: 'A JSON-serialized array of results for the inline query',
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: ['answerInlineQuery'],
						resource: ['callback'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Cache Time',
						name: 'cache_time',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						default: 0,
						description:
							'The maximum amount of time in seconds that the result of the callback query may be cached client-side',
					},
					{
						displayName: 'Show Alert',
						name: 'show_alert',
						type: 'boolean',
						default: false,
						description:
							'Whether an alert will be shown by the client instead of a notification at the top of the chat screen',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						default: '',
						description:
							'Text of the notification. If not specified, nothing will be shown to the user, 0-200 characters.',
					},
					{
						displayName: 'URL',
						name: 'url',
						type: 'string',
						default: '',
						description: "URL that will be opened by the user's client",
					},
				],
			},

			// ----------------------------------
			//         file
			// ----------------------------------

			// ----------------------------------
			//         file:get/download
			// ----------------------------------

			{
				displayName: 'File ID',
				name: 'fileId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['get'],
						resource: ['file'],
					},
				},
				required: true,
				description: 'The ID of the file',
			},
			{
				displayName: 'Download',
				name: 'download',
				type: 'boolean',
				displayOptions: {
					show: {
						operation: ['get'],
						resource: ['file'],
					},
				},
				default: true,
				description: 'Whether to download the file',
			},

			// ----------------------------------
			//         message
			// ----------------------------------

			// ----------------------------------
			//         message:editMessageText
			// ----------------------------------

			{
				displayName: 'Message Type',
				name: 'messageType',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Inline Message',
						value: 'inlineMessage',
					},
					{
						name: 'Message',
						value: 'message',
					},
				],
				default: 'message',
				description: 'The type of the message to edit',
			},

			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						messageType: ['message'],
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				required: true,
				description:
					'Unique identifier for the target chat or username, To find your chat ID ask @get_id_bot',
			},
			// ----------------------------------
			//         message:sendAnimation/sendAudio/sendDocument/sendPhoto/sendSticker/sendVideo
			// ----------------------------------

			{
				displayName: 'Binary File',
				name: 'binaryData',
				type: 'boolean',
				default: false,
				required: true,
				displayOptions: {
					show: {
						operation: [
							'sendAnimation',
							'sendAudio',
							'sendDocument',
							'sendPhoto',
							'sendVideo',
							'sendSticker',
						],
						resource: ['message'],
					},
				},
				description: 'Whether the data to upload should be taken from binary field',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				hint: 'The name of the input binary field containing the file to be written',
				displayOptions: {
					show: {
						operation: [
							'sendAnimation',
							'sendAudio',
							'sendDocument',
							'sendPhoto',
							'sendVideo',
							'sendSticker',
						],
						resource: ['message'],
						binaryData: [true],
					},
				},
				placeholder: '',
				description: 'Name of the binary property that contains the data to upload',
			},
			{
				displayName: 'Message ID',
				name: 'messageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						messageType: ['message'],
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				required: true,
				description: 'Unique identifier of the message to edit',
			},
			{
				displayName: 'Inline Message ID',
				name: 'inlineMessageId',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						messageType: ['inlineMessage'],
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				required: true,
				description: 'Unique identifier of the inline message to edit',
			},
			{
				displayName: 'Reply Markup',
				name: 'replyMarkup',
				displayOptions: {
					show: {
						operation: ['editMessageText'],
						resource: ['message'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'Inline Keyboard',
						value: 'inlineKeyboard',
					},
				],
				default: 'none',
				description: 'Additional interface options',
			},

			// ----------------------------------
			//         message:sendAnimation
			// ----------------------------------
			{
				displayName: 'Animation',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendAnimation'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description:
					'Animation to send. Pass a file_id to send an animation that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get an animation from the Internet.',
			},

			// ----------------------------------
			//         message:sendAudio
			// ----------------------------------
			{
				displayName: 'Audio',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendAudio'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description:
					'Audio file to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get a file from the Internet.',
			},

			// ----------------------------------
			//         message:sendChatAction
			// ----------------------------------
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				displayOptions: {
					show: {
						operation: ['sendChatAction'],
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Find Location',
						value: 'find_location',
						action: 'Find location',
					},
					{
						name: 'Record Audio',
						value: 'record_audio',
						action: 'Record audio',
					},
					{
						name: 'Record Video',
						value: 'record_video',
						action: 'Record video',
					},
					{
						name: 'Record Video Note',
						value: 'record_video_note',
						action: 'Record video note',
					},
					{
						name: 'Typing',
						value: 'typing',
						action: 'Typing a message',
					},
					{
						name: 'Upload Audio',
						value: 'upload_audio',
						action: 'Upload audio',
					},
					{
						name: 'Upload Document',
						value: 'upload_document',
						action: 'Upload document',
					},
					{
						name: 'Upload Photo',
						value: 'upload_photo',
						action: 'Upload photo',
					},
					{
						name: 'Upload Video',
						value: 'upload_video',
						action: 'Upload video',
					},
					{
						name: 'Upload Video Note',
						value: 'upload_video_note',
						action: 'Upload video note',
					},
				],
				default: 'typing',
				description:
					'Type of action to broadcast. Choose one, depending on what the user is about to receive. The status is set for 5 seconds or less (when a message arrives from your bot).',
			},

			// ----------------------------------
			//         message:sendContact
			// ----------------------------------
			{
				displayName: 'Phone Number',
				name: 'phone_number',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				default: '',
				description: 'Phone number of the contact',
			},
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				default: '',
				description: 'First name of the contact',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				default: '',
				description: 'Last name of the contact',
			},
			{
				displayName: 'VCard',
				name: 'vcard',
				type: 'string',
				displayOptions: {
					show: {
						operation: ['sendContact'],
						resource: ['message'],
					},
				},
				default: '',
				description: 'Additional data about the contact in the form of a vCard, 0-2048 bytes',
			},

			// ----------------------------------
			//         message:sendDocument
			// ----------------------------------
			{
				displayName: 'Document',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendDocument'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description:
					'Document to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get a file from the Internet.',
			},

			// ----------------------------------
			//         message:sendLocation
			// ----------------------------------
			{
				displayName: 'Latitude',
				name: 'latitude',
				type: 'number',
				default: 0.0,
				typeOptions: {
					numberPrecision: 10,
					minValue: -90,
					maxValue: 90,
				},
				displayOptions: {
					show: {
						operation: ['sendLocation'],
						resource: ['message'],
					},
				},
				description: 'Location latitude',
			},

			{
				displayName: 'Longitude',
				name: 'longitude',
				type: 'number',
				typeOptions: {
					numberPrecision: 10,
					minValue: -180,
					maxValue: 180,
				},
				default: 0.0,
				displayOptions: {
					show: {
						operation: ['sendLocation'],
						resource: ['message'],
					},
				},
				description: 'Location longitude',
			},

			// ----------------------------------
			//         message:sendMediaGroup
			// ----------------------------------
			{
				displayName: 'Media',
				name: 'media',
				type: 'fixedCollection',
				displayOptions: {
					show: {
						operation: ['sendMediaGroup'],
						resource: ['message'],
					},
				},
				description: 'The media to add',
				placeholder: 'Add Media',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				options: [
					{
						displayName: 'Media',
						name: 'media',
						values: [
							{
								displayName: 'Type',
								name: 'type',
								type: 'options',
								options: [
									{
										name: 'Photo',
										value: 'photo',
									},
									{
										name: 'Video',
										value: 'video',
									},
								],
								default: 'photo',
								description: 'The type of the media to add',
							},
							{
								displayName: 'Media File',
								name: 'media',
								type: 'string',
								default: '',
								description:
									'Media to send. Pass a file_id to send a file that exists on the Telegram servers (recommended) or pass an HTTP URL for Telegram to get a file from the Internet.',
							},
							{
								displayName: 'Additional Fields',
								name: 'additionalFields',
								type: 'collection',
								placeholder: 'Add Field',
								default: {},
								options: [
									{
										displayName: 'Caption',
										name: 'caption',
										type: 'string',
										default: '',
										description: 'Caption text to set, 0-1024 characters',
									},
									{
										displayName: 'Parse Mode',
										name: 'parse_mode',
										type: 'options',
										options: [
											{
												name: 'Markdown (Legacy)',
												value: 'Markdown',
											},
											{
												name: 'MarkdownV2',
												value: 'MarkdownV2',
											},
											{
												name: 'HTML',
												value: 'HTML',
											},
										],
										default: 'HTML',
										description: 'How to parse the text',
									},
								],
							},
						],
					},
				],
			},

			// ----------------------------------
			//         message:sendMessage
			// ----------------------------------
			{
				displayName: 'Text',
				name: 'text',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['editMessageText', 'sendMessage'],
						resource: ['message'],
					},
				},
				description: 'Text of the message to be sent',
			},

			// ----------------------------------
			//         message:sendPhoto
			// ----------------------------------
			{
				displayName: 'Photo',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendPhoto'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description:
					'Photo to send. Pass a file_id to send a photo that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get a photo from the Internet.',
			},

			// ----------------------------------
			//         message:sendPoll
			// ----------------------------------
			{
				displayName: 'Question',
				name: 'question',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description: 'Poll question, 1-300 characters',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				required: true,
				default: {},
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description: 'Poll options, 2-12 options are allowed',
				options: [
					{
						displayName: 'Option',
						name: 'option',
						values: [
							{
								displayName: 'Text',
								name: 'text',
								type: 'string',
								default: '',
								description: 'Option text, 1-100 characters',
							},
						],
					},
				],
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{
						name: 'Regular',
						value: 'regular',
					},
					{
						name: 'Quiz',
						value: 'quiz',
					},
				],
				default: 'regular',
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description: 'Poll type',
			},
			{
				displayName: 'Anonymous',
				name: 'is_anonymous',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description: 'Whether the poll needs to be anonymous',
			},
			{
				displayName: 'Allows Multiple Answers',
				name: 'allows_multiple_answers',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
						type: ['regular'],
					},
				},
				description: 'Whether the poll allows multiple answers',
			},
			{
				displayName: 'Correct Option ID',
				name: 'correct_option_id',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
						type: ['quiz'],
					},
				},
				description: '0-based identifier of the correct answer option. Required for quiz polls.',
			},
			{
				displayName: 'Explanation',
				name: 'explanation',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
						type: ['quiz'],
					},
				},
				description:
					'Text that is shown when a user chooses an incorrect answer or taps on the lamp icon in a quiz-style poll, 0-200 characters',
			},
			{
				displayName: 'Open Period',
				name: 'open_period',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description:
					'Amount of time in seconds the poll will be active after creation, 5-600. Cannot be used together with close_date.',
			},
			{
				displayName: 'Close Date',
				name: 'close_date',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description:
					'Point in time (Unix timestamp) when the poll will be automatically closed. Must be at least 5 and no more than 600 seconds in the future. Cannot be used together with open_period.',
			},
			{
				displayName: 'Is Closed',
				name: 'is_closed',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						operation: ['sendPoll'],
						resource: ['message'],
					},
				},
				description: 'Whether the poll is closed',
			},

			// ----------------------------------
			//         message:sendSticker
			// ----------------------------------
			{
				displayName: 'Sticker',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendSticker'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description:
					'Sticker to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get a .webp file from the Internet.',
			},

			// ----------------------------------
			//         message:sendVideo
			// ----------------------------------
			{
				displayName: 'Video',
				name: 'file',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						operation: ['sendVideo'],
						resource: ['message'],
						binaryData: [false],
					},
				},
				description:
					'Video file to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), an HTTP URL for Telegram to get a file from the Internet.',
			},

			// ----------------------------------
			//         message:editMessageText/sendAnimation/sendAudio/sendLocation/sendMessage/sendPhoto/sendSticker/sendVideo
			// ----------------------------------

			{
				displayName: 'Reply Markup',
				name: 'replyMarkup',
				displayOptions: {
					show: {
						operation: [
							'sendAnimation',
							'sendDocument',
							'sendMessage',
							'sendContact',
							'sendPoll',
							'sendPhoto',
							'sendSticker',
							'sendVideo',
							'sendAudio',
							'sendLocation',
						],
						resource: ['message'],
					},
				},
				type: 'options',
				options: [
					{
						name: 'Force Reply',
						value: 'forceReply',
					},
					{
						name: 'Inline Keyboard',
						value: 'inlineKeyboard',
					},
					{
						name: 'None',
						value: 'none',
					},
					{
						name: 'Reply Keyboard',
						value: 'replyKeyboard',
					},
					{
						name: 'Reply Keyboard Remove',
						value: 'replyKeyboardRemove',
					},
				],
				default: 'none',
				description: 'Additional interface options',
			},

			{
				displayName: 'Force Reply',
				name: 'forceReply',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						replyMarkup: ['forceReply'],
						resource: ['message'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Force Reply',
						name: 'force_reply',
						type: 'boolean',
						default: false,
						description:
							'Whether to show reply interface to the user, as if they manually selected the bot‘s message and tapped ’Reply',
					},
					{
						displayName: 'Selective',
						name: 'selective',
						type: 'boolean',
						default: false,
						description: 'Whether to force reply from specific users only',
					},
				],
			},

			{
				displayName: 'Specify Keyboard',
				name: 'specifyKeyboard',
				type: 'options',
				displayOptions: {
					show: {
						replyMarkup: ['inlineKeyboard', 'replyKeyboard'],
						resource: ['message'],
					},
				},
				options: [
					{
						name: 'Using Fields Below',
						value: 'ui',
					},
					{
						name: 'Using JSON',
						value: 'json',
					},
				],
				default: 'ui',
				description: 'How to specify the keyboard',
			},

			{
				displayName: 'Keyboard (JSON)',
				name: 'keyboardJson',
				type: 'json',
				displayOptions: {
					show: {
						replyMarkup: ['inlineKeyboard', 'replyKeyboard'],
						resource: ['message'],
						specifyKeyboard: ['json'],
					},
				},
				default: '',
				description: 'Keyboard as JSON object',
				placeholder: '{"inline_keyboard": [[{"text": "Button", "callback_data": "data"}]]}',
			},

			{
				displayName: 'Inline Keyboard',
				name: 'inlineKeyboard',
				placeholder: 'Add Keyboard Row',
				description: 'Adds an inline keyboard that appears right next to the message it belongs to',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						replyMarkup: ['inlineKeyboard'],
						resource: ['message'],
						specifyKeyboard: ['ui'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Rows',
						name: 'rows',
						values: [
							{
								displayName: 'Row',
								name: 'row',
								type: 'fixedCollection',
								description: 'The value to set',
								placeholder: 'Add Button',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										displayName: 'Buttons',
										name: 'buttons',
										values: [
											{
												displayName: 'Text',
												name: 'text',
												type: 'string',
												default: '',
												description: 'Label text on the button',
											},
											{
												displayName: 'Additional Fields',
												name: 'additionalFields',
												type: 'collection',
												placeholder: 'Add Field',
												default: {},
												options: [
													{
														displayName: 'Callback Data',
														name: 'callback_data',
														type: 'string',
														default: '',
														description:
															'Data to be sent in a callback query to the bot when button is pressed, 1-64 bytes',
													},
													{
														displayName: 'Pay',
														name: 'pay',
														type: 'boolean',
														default: false,
														description: 'Whether to send a Pay button',
													},
													{
														displayName: 'Switch Inline Query Current Chat',
														name: 'switch_inline_query_current_chat',
														type: 'string',
														default: '',
														description:
															"If set, pressing the button will insert the bot‘s username and the specified inline query in the current chat's input field.Can be empty, in which case only the bot’s username will be inserted",
													},
													{
														displayName: 'Switch Inline Query',
														name: 'switch_inline_query',
														type: 'string',
														default: '',
														description:
															'If set, pressing the button will prompt the user to select one of their chats, open that chat and insert the bot‘s username and the specified inline query in the input field. Can be empty, in which case just the bot’s username will be inserted.',
													},
													{
														displayName: 'URL',
														name: 'url',
														type: 'string',
														default: '',
														description: 'HTTP or tg:// URL to be opened when button is pressed',
													},
													{
														displayName: 'Web App',
														name: 'web_app',
														type: 'collection',
														placeholder: 'Set Telegram Web App URL',
														typeOptions: {
															multipleValues: false,
														},
														default: {},
														options: [
															{
																displayName: 'URL',
																name: 'url',
																type: 'string',
																default: '',
																description: 'An HTTPS URL of a Web App to be opened',
															},
														],
														description: 'Launch the Telegram Web App',
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			},

			{
				displayName: 'Reply Keyboard',
				name: 'replyKeyboard',
				placeholder: 'Add Reply Keyboard Row',
				description: 'Adds a custom keyboard with reply options',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						replyMarkup: ['replyKeyboard'],
						specifyKeyboard: ['ui'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Rows',
						name: 'rows',
						values: [
							{
								displayName: 'Row',
								name: 'row',
								type: 'fixedCollection',
								description: 'The value to set',
								placeholder: 'Add Button',
								typeOptions: {
									multipleValues: true,
								},
								default: {},
								options: [
									{
										displayName: 'Buttons',
										name: 'buttons',
										values: [
											{
												displayName: 'Text',
												name: 'text',
												type: 'string',
												default: '',
												description:
													'Text of the button. If none of the optional fields are used, it will be sent as a message when the button is pressed.',
											},
											{
												displayName: 'Additional Fields',
												name: 'additionalFields',
												type: 'collection',
												placeholder: 'Add Field',
												default: {},
												options: [
													{
														displayName: 'Request Contact',
														name: 'request_contact',
														type: 'boolean',
														default: false,
														description:
															"Whether the user's phone number will be sent as a contact when the button is pressed.Available in private chats only",
													},
													{
														displayName: 'Request Location',
														name: 'request_location',
														type: 'boolean',
														default: false,
														description: "Whether the user's request_location",
													},
													{
														displayName: 'Web App',
														name: 'web_app',
														type: 'collection',
														placeholder: 'Set Telegram Web App URL',
														typeOptions: {
															multipleValues: false,
														},
														default: {},
														options: [
															{
																displayName: 'URL',
																name: 'url',
																type: 'string',
																default: '',
																description: 'An HTTPS URL of a Web App to be opened',
															},
														],
														description: 'Launch the Telegram Web App',
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			},

			{
				displayName: 'Reply Keyboard Options',
				name: 'replyKeyboardOptions',
				type: 'collection',
				placeholder: 'Add option',
				displayOptions: {
					show: {
						replyMarkup: ['replyKeyboard'],
						specifyKeyboard: ['ui'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Resize Keyboard',
						name: 'resize_keyboard',
						type: 'boolean',
						default: false,
						description:
							'Whether to request clients to resize the keyboard vertically for optimal fit',
					},
					{
						displayName: 'One Time Keyboard',
						name: 'one_time_keyboard',
						type: 'boolean',
						default: false,
						description:
							"Whether to request clients to hide the keyboard as soon as it's been used",
					},
					{
						displayName: 'Selective',
						name: 'selective',
						type: 'boolean',
						default: false,
						description: 'Whether to show the keyboard to specific users only',
					},
				],
			},

			{
				displayName: 'Reply Keyboard Remove',
				name: 'replyKeyboardRemove',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						replyMarkup: ['replyKeyboardRemove'],
					},
				},
				default: {},
				options: [
					{
						displayName: 'Remove Keyboard',
						name: 'remove_keyboard',
						type: 'boolean',
						default: false,
						description: 'Whether to request clients to remove the custom keyboard',
					},
					{
						displayName: 'Selective',
						name: 'selective',
						type: 'boolean',
						default: false,
						description: 'Whether to force reply from specific users only',
					},
				],
			},

			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				displayOptions: {
					show: {
						operation: [
							'editMessageText',
							'sendAnimation',
							'sendAudio',
							'sendContact',
							'sendDocument',
							'sendLocation',
							'sendMessage',
							'sendMediaGroup',
							'sendPhoto',
							'sendPoll',
							'sendSticker',
							'sendVideo',
						],
						resource: ['message'],
					},
				},
				default: {},
				options: [
					{
						...appendAttributionOption,
						description:
							'Whether to include the phrase “This message was sent automatically with n8n” to the end of the message',
						displayOptions: {
							show: {
								'/operation': ['sendMessage'],
							},
						},
					},
					{
						displayName: 'Caption',
						name: 'caption',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': [
									'sendAnimation',
									'sendAudio',
									'sendDocument',
									'sendPhoto',
									'sendVideo',
								],
							},
						},
						default: '',
						description: 'Caption text to set, 0-1024 characters',
					},
					{
						displayName: 'Disable Notification',
						name: 'disable_notification',
						type: 'boolean',
						default: false,
						displayOptions: {
							hide: {
								'/operation': ['editMessageText'],
							},
						},
						description:
							'Whether to send the message silently. Users will receive a notification with no sound.',
					},
					{
						displayName: 'Disable WebPage Preview',
						name: 'disable_web_page_preview',
						type: 'boolean',
						displayOptions: {
							show: {
								'/operation': ['editMessageText', 'sendMessage'],
							},
						},
						default: false,
						description: 'Whether to disable link previews for links in this message',
					},
					{
						displayName: 'Duration',
						name: 'duration',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						displayOptions: {
							show: {
								'/operation': ['sendAnimation', 'sendAudio', 'sendVideo'],
							},
						},
						default: 0,
						description: 'Duration of clip in seconds',
					},
					{
						displayName: 'File Name',
						name: 'fileName',
						type: 'string',
						default: '',
						displayOptions: {
							show: {
								'/operation': [
									'sendAnimation',
									'sendAudio',
									'sendDocument',
									'sendPhoto',
									'sendVideo',
									'sendSticker',
								],
								'/resource': ['message'],
								'/binaryData': [true],
							},
						},
						placeholder: 'image.jpeg',
					},
					{
						displayName: 'Height',
						name: 'height',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						displayOptions: {
							show: {
								'/operation': ['sendAnimation', 'sendVideo'],
							},
						},
						default: 0,
						description: 'Height of the video',
					},
					{
						displayName: 'Parse Mode',
						name: 'parse_mode',
						type: 'options',
						options: [
							{
								name: 'Markdown (Legacy)',
								value: 'Markdown',
							},
							{
								name: 'MarkdownV2',
								value: 'MarkdownV2',
							},
							{
								name: 'HTML',
								value: 'HTML',
							},
						],
						displayOptions: {
							show: {
								'/operation': [
									'editMessageText',
									'sendAnimation',
									'sendAudio',
									'sendMessage',
									'sendPhoto',
									'sendVideo',
									'sendDocument',
								],
							},
						},
						default: 'HTML',
						description: 'How to parse the text',
					},
					{
						displayName: 'Performer',
						name: 'performer',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': ['sendAudio'],
							},
						},
						default: '',
						description: 'Name of the performer',
					},
					{
						displayName: 'Reply To Message ID',
						name: 'reply_to_message_id',
						type: 'number',
						displayOptions: {
							hide: {
								'/operation': ['editMessageText'],
							},
						},
						default: 0,
						description: 'If the message is a reply, ID of the original message',
					},
					{
						displayName: 'Message Thread ID',
						name: 'message_thread_id',
						type: 'number',
						displayOptions: {
							show: {
								'/operation': [
									'sendAnimation',
									'sendAudio',
									'sendChatAction',
									'sendDocument',
									'sendLocation',
									'sendMediaGroup',
									'sendMessage',
									'sendContact',
									'sendPhoto',
									'sendSticker',
									'sendVideo',
								],
							},
						},
						default: 0,
						description: 'The unique identifier of the forum topic',
					},
					{
						displayName: 'Title',
						name: 'title',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': ['sendAudio'],
							},
						},
						default: '',
						description: 'Title of the track',
					},
					{
						displayName: 'Thumbnail',
						name: 'thumb',
						type: 'string',
						displayOptions: {
							show: {
								'/operation': ['sendAnimation', 'sendAudio', 'sendDocument', 'sendVideo'],
							},
						},
						default: '',
						description:
							'Thumbnail of the file sent; can be ignored if thumbnail generation for the file is supported server-side. The thumbnail should be in JPEG format and less than 200 kB in size. A thumbnail‘s width and height should not exceed 320.',
					},
					{
						displayName: 'Width',
						name: 'width',
						type: 'number',
						typeOptions: {
							minValue: 0,
						},
						displayOptions: {
							show: {
								'/operation': ['sendAnimation', 'sendVideo'],
							},
						},
						default: 0,
						description: 'Width of the video',
					},
				],
			},

			...getSendAndWaitProperties(
				[
					{
						displayName: 'Chat ID',
						name: 'chatId',
						type: 'string',
						default: '',
						required: true,
						description:
							'Unique identifier for the target chat or username of the target channel (in the format @channelusername). To find your chat ID ask @get_id_bot.',
					},
				],
				'message',
				undefined,
				{
					noButtonStyle: true,
					defaultApproveLabel: '✅ Approve',
					defaultDisapproveLabel: '❌ Decline',
				},
			).filter((p) => p.name !== 'subject'),
		],
	};

	webhook = sendAndWaitWebhook;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: IHttpRequestMethods;
		let endpoint: string;

		const operation = this.getNodeParameter('operation', 0);
		const resource = this.getNodeParameter('resource', 0);
		const binaryData = this.getNodeParameter('binaryData', 0, false);

		const nodeVersion = this.getNode().typeVersion;
		const instanceId = this.getInstanceId();

		if (resource === 'message' && operation === SEND_AND_WAIT_OPERATION) {
			body = createSendAndWaitMessageBody(this);

			await apiRequest.call(this, 'POST', 'sendMessage', body);

			const waitTill = configureWaitTillDate(this);

			await this.putExecutionToWait(waitTill);
			return [this.getInputData()];
		}

		for (let i = 0; i < items.length; i++) {
			try {
				// Reset all values
				requestMethod = 'POST';
				endpoint = '';
				body = {};
				qs = {};

				if (resource === 'callback') {
					if (operation === 'answerQuery') {
						// ----------------------------------
						//         callback:answerQuery
						// ----------------------------------

						endpoint = 'answerCallbackQuery';

						body.callback_query_id = this.getNodeParameter('queryId', i) as string;

						// Add additional fields
						const additionalFields = this.getNodeParameter('additionalFields', i);
						Object.assign(body, additionalFields);
					} else if (operation === 'answerInlineQuery') {
						// -----------------------------------------------
						//         callback:answerInlineQuery
						// -----------------------------------------------

						endpoint = 'answerInlineQuery';

						body.inline_query_id = this.getNodeParameter('queryId', i) as string;
						body.results = this.getNodeParameter('results', i) as string;

						// Add additional fields
						const additionalFields = this.getNodeParameter('additionalFields', i);
						Object.assign(body, additionalFields);
					}
				} else if (resource === 'chat') {
					if (operation === 'get') {
						// ----------------------------------
						//         chat:get
						// ----------------------------------

						endpoint = 'getChat';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
					} else if (operation === 'administrators') {
						// ----------------------------------
						//         chat:administrators
						// ----------------------------------

						endpoint = 'getChatAdministrators';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
					} else if (operation === 'leave') {
						// ----------------------------------
						//         chat:leave
						// ----------------------------------

						endpoint = 'leaveChat';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
					} else if (operation === 'member') {
						// ----------------------------------
						//         chat:member
						// ----------------------------------

						endpoint = 'getChatMember';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.user_id = this.getNodeParameter('userId', i) as string;
					} else if (operation === 'setDescription') {
						// ----------------------------------
						//         chat:setDescription
						// ----------------------------------

						endpoint = 'setChatDescription';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.description = this.getNodeParameter('description', i) as string;
					} else if (operation === 'setTitle') {
						// ----------------------------------
						//         chat:setTitle
						// ----------------------------------

						endpoint = 'setChatTitle';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.title = this.getNodeParameter('title', i) as string;
					}
					// } else if (resource === 'bot') {
					// 	if (operation === 'info') {
					// 		endpoint = 'getUpdates';
					// 	}
				} else if (resource === 'file') {
					if (operation === 'get') {
						// ----------------------------------
						//         file:get
						// ----------------------------------

						endpoint = 'getFile';

						body.file_id = this.getNodeParameter('fileId', i) as string;
					}
				} else if (resource === 'message') {
					if (operation === 'editMessageText') {
						// ----------------------------------
						//         message:editMessageText
						// ----------------------------------

						endpoint = 'editMessageText';

						const messageType = this.getNodeParameter('messageType', i) as string;

						if (messageType === 'inlineMessage') {
							body.inline_message_id = this.getNodeParameter('inlineMessageId', i) as string;
						} else {
							body.chat_id = this.getNodeParameter('chatId', i) as string;
							body.message_id = this.getNodeParameter('messageId', i) as string;
						}

						body.text = this.getNodeParameter('text', i) as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'deleteMessage') {
						// ----------------------------------
						//       message:deleteMessage
						// ----------------------------------

						endpoint = 'deleteMessage';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.message_id = this.getNodeParameter('messageId', i) as string;
					} else if (operation === 'pinChatMessage') {
						// ----------------------------------
						//        message:pinChatMessage
						// ----------------------------------

						endpoint = 'pinChatMessage';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.message_id = this.getNodeParameter('messageId', i) as string;

						const { disable_notification } = this.getNodeParameter('additionalFields', i);
						if (disable_notification) {
							body.disable_notification = true;
						}
					} else if (operation === 'unpinChatMessage') {
						// ----------------------------------
						//        message:unpinChatMessage
						// ----------------------------------

						endpoint = 'unpinChatMessage';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.message_id = this.getNodeParameter('messageId', i) as string;
					} else if (operation === 'sendAnimation') {
						// ----------------------------------
						//         message:sendAnimation
						// ----------------------------------

						endpoint = 'sendAnimation';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.animation = this.getNodeParameter('file', i, '') as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendAudio') {
						// ----------------------------------
						//         message:sendAudio
						// ----------------------------------

						endpoint = 'sendAudio';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.audio = this.getNodeParameter('file', i, '') as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendChatAction') {
						// ----------------------------------
						//         message:sendChatAction
						// ----------------------------------

						endpoint = 'sendChatAction';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.action = this.getNodeParameter('action', i) as string;
					} else if (operation === 'sendContact') {
						// ----------------------------------
						//         message:sendContact
						// ----------------------------------

						endpoint = 'sendContact';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.phone_number = this.getNodeParameter('phone_number', i) as string;
						body.first_name = this.getNodeParameter('first_name', i) as string;

						// Add optional parameters only if they have values
						const lastName = this.getNodeParameter('last_name', i) as string;
						if (lastName) {
							body.last_name = lastName;
						}

						const vcard = this.getNodeParameter('vcard', i) as string;
						if (vcard) {
							body.vcard = vcard;
						}

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendDocument') {
						// ----------------------------------
						//         message:sendDocument
						// ----------------------------------

						endpoint = 'sendDocument';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.document = this.getNodeParameter('file', i, '') as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendLocation') {
						// ----------------------------------
						//         message:sendLocation
						// ----------------------------------

						endpoint = 'sendLocation';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.latitude = this.getNodeParameter('latitude', i) as string;
						body.longitude = this.getNodeParameter('longitude', i) as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendMessage') {
						// ----------------------------------
						//         message:sendMessage
						// ----------------------------------

						endpoint = 'sendMessage';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.text = this.getNodeParameter('text', i) as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i, nodeVersion, instanceId);
					} else if (operation === 'sendMediaGroup') {
						// ----------------------------------
						//         message:sendMediaGroup
						// ----------------------------------

						endpoint = 'sendMediaGroup';

						body.chat_id = this.getNodeParameter('chatId', i) as string;

						const additionalFields = this.getNodeParameter('additionalFields', i);
						Object.assign(body, additionalFields);

						const mediaItems = this.getNodeParameter('media', i) as IDataObject;
						body.media = [];
						for (const mediaItem of mediaItems.media as IDataObject[]) {
							if (mediaItem.additionalFields !== undefined) {
								Object.assign(mediaItem, mediaItem.additionalFields);
								delete mediaItem.additionalFields;
							}
							(body.media as IDataObject[]).push(mediaItem);
						}
					} else if (operation === 'sendPhoto') {
						// ----------------------------------
						//         message:sendPhoto
						// ----------------------------------

						endpoint = 'sendPhoto';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.photo = this.getNodeParameter('file', i, '') as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendPoll') {
						// ----------------------------------
						//         message:sendPoll
						// ----------------------------------

						endpoint = 'sendPoll';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.question = this.getNodeParameter('question', i) as string;

						// Process options
						const options = this.getNodeParameter('options', i) as IDataObject;
						if (options && options.option) {
							const optionArray = (options.option as IDataObject[]).map((option) => option.text);
							body.options = JSON.stringify(optionArray);
						}

						// Add optional parameters
						const type = this.getNodeParameter('type', i) as string;
						if (type === 'quiz') {
							body.type = 'quiz';
							const correctOptionId = this.getNodeParameter('correct_option_id', i) as number;
							body.correct_option_id = correctOptionId;

							const explanation = this.getNodeParameter('explanation', i) as string;
							if (explanation) {
								body.explanation = explanation;
							}
						}

						const isAnonymous = this.getNodeParameter('is_anonymous', i) as boolean;
						body.is_anonymous = isAnonymous;

						if (type === 'regular') {
							const allowsMultipleAnswers = this.getNodeParameter(
								'allows_multiple_answers',
								i,
							) as boolean;
							if (allowsMultipleAnswers) {
								body.allows_multiple_answers = allowsMultipleAnswers;
							}
						}

						const openPeriod = this.getNodeParameter('open_period', i) as number;
						if (openPeriod > 0) {
							body.open_period = openPeriod;
						}

						const closeDate = this.getNodeParameter('close_date', i) as number;
						if (closeDate > 0) {
							body.close_date = closeDate;
						}

						const isClosed = this.getNodeParameter('is_closed', i) as boolean;
						if (isClosed) {
							body.is_closed = isClosed;
						}

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendSticker') {
						// ----------------------------------
						//         message:sendSticker
						// ----------------------------------

						endpoint = 'sendSticker';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.sticker = this.getNodeParameter('file', i, '') as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					} else if (operation === 'sendVideo') {
						// ----------------------------------
						//         message:sendVideo
						// ----------------------------------

						endpoint = 'sendVideo';

						body.chat_id = this.getNodeParameter('chatId', i) as string;
						body.video = this.getNodeParameter('file', i, '') as string;

						// Add additional fields and replyMarkup
						addAdditionalFields.call(this, body, i);
					}
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`, {
						itemIndex: i,
					});
				}

				let responseData;

				if (binaryData) {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', 0);
					const itemBinaryData = items[i].binary![binaryPropertyName];
					const propertyName = getPropertyName(operation);
					const fileName = this.getNodeParameter('additionalFields.fileName', 0, '') as string;

					const filename = fileName || itemBinaryData.fileName?.toString();

					if (!fileName && !itemBinaryData.fileName) {
						throw new NodeOperationError(
							this.getNode(),
							`File name is needed to ${operation}. Make sure the property that holds the binary data
						has the file name property set or set it manually in the node using the File Name parameter under
						Additional Fields.`,
						);
					}

					body.disable_notification = body.disable_notification?.toString() || 'false';

					let uploadData: Buffer | Readable;
					if (itemBinaryData.id) {
						uploadData = await this.helpers.getBinaryStream(itemBinaryData.id);
					} else {
						uploadData = Buffer.from(itemBinaryData.data, BINARY_ENCODING);
					}

					const formData = {
						...body,
						[propertyName]: {
							value: uploadData,
							options: {
								filename,
								contentType: itemBinaryData.mimeType,
							},
						},
					};

					if (formData.reply_markup) {
						formData.reply_markup = JSON.stringify(formData.reply_markup);
					}

					responseData = await apiRequest.call(this, requestMethod, endpoint, {}, qs, {
						formData,
					});
				} else {
					responseData = await apiRequest.call(this, requestMethod, endpoint, body, qs);
				}

				if (resource === 'file' && operation === 'get') {
					if (this.getNodeParameter('download', i, false)) {
						const filePath = responseData.result.file_path;

						const credentials = await this.getCredentials('telegramApi');
						const file = await apiRequest.call(
							this,
							'GET',
							'',
							{},
							{},
							{
								json: false,
								encoding: null,
								uri: `${credentials.baseUrl}/file/bot${credentials.accessToken}/${filePath}`,
								resolveWithFullResponse: true,
								useStream: true,
							},
						);

						const fileName = filePath.split('/').pop();

						const data = await this.helpers.prepareBinaryData(
							file.body as Buffer,
							fileName as string,
						);

						returnData.push({
							json: responseData,
							binary: { data },
							pairedItem: { item: i },
						});
						continue;
					}
				} else if (resource === 'chat' && operation === 'administrators') {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray(responseData.result as IDataObject[]),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.description ?? error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
