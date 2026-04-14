# Inbound Email CLI

An AI-first command-line tool for sending, receiving, and managing emails via the [inbound.new](https://inbound.new) API.

## Features

- **Send Emails**: Support for multiple recipients, CC, BCC, Reply-To, and attachments.
- **List & Filter**: View received, sent, or scheduled emails with filtering by address or search query.
- **Thread Management**: View grouped conversations and reply to specific threads.
- **Attachment Handling**: Download attachments directly to your local machine.
- **Webhook Integration**: Easily create and manage webhook endpoints for incoming mail.

## Installation

```bash
# Clone the repository
git clone https://github.com/Jaspreet84/inbound-mail-client.git
cd inbound-mail-client

# Install dependencies
npm install

# Build the project
npm run build

# Link the CLI (optional)
npm link
```

## Configuration

The CLI requires an API key from `inbound.new`. You can provide it in two ways:

1.  Create an `api.key` file in the project root containing your key.
2.  Set the `INBOUND_API_KEY` environment variable.

## Usage

### Sending an Email
```bash
inbound send \
  --from "admin@yourdomain.com" \
  --to "recipient@example.com" \
  --subject "Hello from CLI" \
  --text "This is a test email." \
  -a ./path/to/document.pdf
```

### Listing Received Emails
```bash
inbound list --address "user@yourdomain.com" --type received
```

### Downloading an Attachment
1. Get the email details to find the filename:
   ```bash
   inbound get <email_id>
   ```
2. Download the file:
   ```bash
   inbound download <email_id> <filename> -o ./downloads
   ```

### Replying to a Thread
```bash
inbound reply <email_id> --from "admin@yourdomain.com" --text "Thank you for your message."
```

### Creating a Webhook
```bash
inbound webhook --url "https://your-api.com/webhook" --filter "subject: urgent"
```

## Commands Summary

| Command | Description |
| :--- | :--- |
| `send` | Send a new email with full support for CC/BCC/Attachments. |
| `list` | List emails with filtering by type, address, or search. |
| `get` | Retrieve full JSON details of a specific email. |
| `threads` | List email threads/conversations. |
| `reply` | Reply to an existing email thread. |
| `download` | Download a specific attachment from an email. |
| `webhook` | Configure a new webhook endpoint. |

## Development

```bash
npm run build   # Compile TypeScript
npm start       # Run directly via tsx (for development)
```

## License

MIT
