# Heygen API Demo

This is a demo application built with [Next.js 14](https://nextjs.org/), [Firebase](https://firebase.google.com/), [Tailwind CSS](https://tailwindcss.com/), and [TypeScript](https://www.typescriptlang.org/). The app demonstrates the use of the [Heygen API](https://heygen.com/) to generate videos using avatars and talking photos, allowing users to interact with AI-driven content creation.

## Features

- **Authentication**: Integrated user authentication using [Clerk](https://clerk.dev/).
- **Payments**: Payment handling with [Stripe](https://stripe.com/).
- **Data Management**: State management using [Zustand](https://github.com/pmndrs/zustand).
- **Heygen API Integration**: Generate videos with AI avatars and talking photos.
- **Server Actions**: Utilize Next.js server actions for secure API calls.
- **Real-Time Feedback**: Display status and error messages during the video generation process.
- **Polling and Webhooks**: Implement both polling and webhook strategies for video generation status updates.
- **UI Components**: Customizable and responsive UI components with Tailwind CSS.

## Getting Started

### Prerequisites

Make sure you have the following tools installed on your machine:

- [Node.js](https://nodejs.org/) (version 18 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/heygen-api-demo.git
   cd heygen-api-demo
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

3. **Configure environment variables**:

   Rename `.env.example` to `.env.local` and fill in the required values:

   ```plaintext
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   NEXT_PUBLIC_STRIPE_PRODUCT_NAME=your_stripe_product_name
   NEXT_PUBLIC_STRIPE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret_key

   # Firebase Client Config
   NEXT_PUBLIC_FIREBASE_APIKEY=your_firebase_apikey
   NEXT_PUBLIC_FIREBASE_AUTHDOMAIN=your_firebase_authdomain
   NEXT_PUBLIC_FIREBASE_PROJECTID=your_firebase_projectid
   NEXT_PUBLIC_FIREBASE_STORAGEBUCKET=your_firebase_storagebucket
   NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID=your_firebase_messagingsenderid
   NEXT_PUBLIC_FIREBASE_APPID=your_firebase_appid
   NEXT_PUBLIC_FIREBASE_MEASUREMENTID=your_firebase_measurementid

   # Firebase Server Config
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_CLIENT_ID=your_firebase_client_id
   FIREBASE_AUTH_URI=your_firebase_auth_uri
   FIREBASE_TOKEN_URI=your_firebase_token_uri
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=your_firebase_auth_provider_cert_url
   FIREBASE_CLIENT_CERTS_URL=your_firebase_client_certs_url
   FIREBASE_UNIVERSE_DOMAIN=your_firebase_universe_domain
   ```

### Running the Application

1. **Start the development server**:

   ```bash
   npm run dev
   ```

   or

   ```bash
   yarn dev
   ```

   The application will be available at `http://localhost:3000`.

2. **Build for production**:

   ```bash
   npm run build
   ```

   or

   ```bash
   yarn build
   ```

   Then start the production server:

   ```bash
   npm run start
   ```

   or

   ```bash
   yarn start
   ```

### Linting

To lint the code, run:

```bash
npm run lint
```

or

```bash
yarn lint
```

## Application Structure

### Middleware

The middleware uses [Clerk's middleware](https://clerk.dev/docs/nextjs) to protect specific routes. It checks if a route requires authentication and, if so, enforces the necessary protection.

### State Management

The application uses [Zustand](https://github.com/pmndrs/zustand) to manage local state and synchronize it with Firebase. The state includes the user's profile information, such as email, display name, and API keys required for Heygen and ElevenLabs integrations.

### Server Actions

1. **Generate Talking Photo Video**:
   Utilizes the Heygen API to generate videos based on user-selected avatars and scripts. It supports both pre-recorded audio and text-to-speech options.
2. **Fetch Heygen Avatars**:
   Retrieves a list of available avatars from the Heygen API to be used for generating videos.
3. **Retrieve Video and Save to Firebase**:
   Polls the Heygen API to check the status of the video rendering, downloads it upon completion, uploads it to Firebase Storage, and stores the metadata in Firestore.

### Polling and Webhooks

The application uses both polling and webhook methods to manage the status of video generation:

- **Polling**: Periodically checks the status of video rendering by sending requests to the Heygen API until the process is complete.
- **Webhooks**: The app can be configured to receive webhook notifications from the Heygen API, providing real-time updates when the video generation is completed. This is more efficient than polling and is recommended for production use.

### Pages

- **Avatars Page**:

  - Allows users to browse, edit, and fetch avatars from the Heygen API.
  - Displays a list of avatars stored in Firebase and provides options to filter by favorites or fetch new avatars.
  - Users can mark avatars as favorites, view details, and fetch the latest avatars directly from the API.

- **Generate Page**:

  - The primary interface for generating videos using selected avatars.
  - Allows users to input a script and choose from different voice settings (pre-recorded audio, text-to-speech, or silence).
  - Displays status and error messages during the video generation process, and shows the generated video upon completion.
  - Provides access to previously generated videos for review.

- **Profile Page**:
  - Allows users to enter their API keys for Heygen and ElevenLabs, view their profile details, and manage their account settings.
  - Displays user authentication data, including email and display name, using Clerk.
  - Integrates a payment page for purchasing additional credits for video generation.

## Deployment

This application can be deployed on any platform that supports Node.js, such as Vercel, Netlify, or AWS. For deployment on [Vercel](https://vercel.com/):

1. Connect your GitHub repository to Vercel.
2. Add environment variables from `.env.local` to your Vercel project settings.
3. Deploy!

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes or enhancements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Clerk](https://clerk.dev/) for authentication.
- [Stripe](https://stripe.com/) for payment processing.
- [Heygen](https://heygen.com/) for the API demo.
- [Firebase](https://firebase.google.com/) for storage and database management.
- [Zustand](https://github.com/pmndrs/zustand) for state management.
- [Tailwind CSS](https://tailwindcss.com/) for styling.

## Contact

For more information or questions, please contact [info@ignitechannel.com](mailto:info@ignitechannel.com).
