{\rtf1\ansi\ansicpg1252\cocoartf2761
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # LastSave\
\
LastSave is a web application designed to manage and upload project assets efficiently. It provides a user-friendly interface for uploading images, organizing projects, and viewing recent uploads.\
\
## Features\
\
- **Projects Page**: View all projects in a grid layout with the most recent images.\
- **Upload Modal**: Easily upload new assets with project details, including project name, date, and client information.\
- **Date Picker**: Integrated date picker for selecting project dates.\
- **Responsive Design**: The application is designed to be responsive and user-friendly on various devices.\
\
## Tech Stack\
\
- **Frontend**: React, Mantine, Vite\
- **Backend**: Node.js, Express\
- **Database**: MySQL\
- **File Storage**: MinIO for object storage\
\
## Getting Started\
\
### Prerequisites\
\
- Node.js (v14 or higher)\
- MySQL\
- Docker (for MinIO and database setup)\
\
### Installation\
\
1. **Clone the repository**:\
   ```bash\
   git clone https://github.com/yourusername/lastsave.git\
   cd lastsave\
   ```\
\
2. **Set up the backend**:\
   - Navigate to the backend directory:\
     ```bash\
     cd backend\
     ```\
   - Install dependencies:\
     ```bash\
     npm install\
     ```\
   - Create a `.env` file with your database and MinIO configurations.\
\
3. **Set up the frontend**:\
   - Navigate to the frontend directory:\
     ```bash\
     cd frontend\
     ```\
   - Install dependencies:\
     ```bash\
     npm install\
     ```\
\
4. **Run the application**:\
   - Start the backend server:\
     ```bash\
     cd backend\
     npm start\
     ```\
   - Start the frontend development server:\
     ```bash\
     cd frontend\
     npm run dev\
     ```\
\
5. **Access the application**:\
   - Open your browser and go to `http://localhost:3090` for the frontend.\
\
## API Endpoints\
\
- **GET /api/projects**: Fetch all projects with their latest images.\
- **GET /api/assets**: Fetch all assets.\
- **POST /api/assets**: Upload new assets.\
\
## Contributing\
\
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.\
\
## License\
\
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.\
\
## Acknowledgments\
\
- Thanks to the Mantine team for their excellent UI components.\
- Thanks to the community for their support and contributions.\
}