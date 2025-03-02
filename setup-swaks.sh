#!/bin/bash

# This script downloads and sets up swaks (Swiss Army Knife for SMTP) for email sending

echo "⏳ Setting up swaks for email notifications..."

# Download swaks
echo "📥 Downloading swaks..."
curl http://www.jetmore.org/john/code/swaks/files/swaks-20130209.0/swaks -o swaks

# Set executable permissions
echo "🔧 Setting executable permissions..."
chmod +x swaks

# Check if perl is installed
if command -v perl >/dev/null 2>&1; then
  echo "✅ Perl is already installed"
else
  echo "📦 Perl is not installed. Attempting to install..."
  
  # Try apt-get (Debian/Ubuntu)
  if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get -y install perl
  # Try brew (macOS)
  elif command -v brew >/dev/null 2>&1; then
    brew install perl
  # Try yum (CentOS/RHEL)
  elif command -v yum >/dev/null 2>&1; then
    sudo yum -y install perl
  else
    echo "❌ Could not install perl automatically. Please install perl manually."
    exit 1
  fi
fi

# Create a test email file
echo "📝 Creating a test email file..."
cat > test-email.html << EOL
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Swaks Test Email</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #FFA500; color: white; padding: 15px; border-radius: 5px 5px 0 0; }
    .content { border: 1px solid #ddd; border-top: none; padding: 20px; border-radius: 0 0 5px 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Swaks Test Email</h1>
  </div>
  <div class="content">
    <p>This is a test email from the Buzzed Beehive Monitoring System.</p>
    <p>If you're seeing this, the swaks setup was successful!</p>
  </div>
</body>
</html>
EOL

echo "✅ Setup complete!"
echo ""
echo "To send a test email, run:"
echo "./swaks --auth \\"
echo "  --server smtp.mailgun.org \\"
echo "  --au postmaster@YOUR_DOMAIN_NAME \\"
echo "  --ap 3kh9umujora5 \\"
echo "  --to recipient@example.com \\"
echo "  --h-Subject: \"Buzzed Beehive Test Email\" \\"
echo "  --body-file test-email.html \\"
echo "  --attach-type text/html"
echo ""
echo "Remember to replace YOUR_DOMAIN_NAME with your actual Mailgun domain"
echo "and recipient@example.com with your email address." 