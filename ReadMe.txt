This git project is for the PayStubIssa website:
1) To ensure that the env is setup correctly make sure you do
        npm install
2) Then after that do:
        npm start   // to build the project: the website will be hosted on http://localhost:3000

Build and Debug Project
-----------------------
1) To build the project open a new Terminal Window.
2) then issue npm install to ensure that all the dependencies are fresh
3) then npm start to build the project.
4) in "Run and Debug" mode run the "Launch Chrome against localhost" configuration
5) setup break points in the code and debug.

Config files layout and xml files loading:
------------------------------------------
The app first loads the template-configs.json file from 
        public\configs\template-configs.json 

The file has the following structure:
        this file contains an array of objects and each object contain properties related to each
        template we offer to the user. A key property of this object is the configFile path,
        this is the path that will drive all the xml details of the particular template.
        see below for example of the fields of this object.
[
  {
    "imageFile": "picture1.png",
    "configFile": "/configs/template-simple/paystub-config.xml",
    "imageName": "paystub-regular.png",
    "title": "Standard Employee Paystub",
    "description": "The standard paystub for a regular, ongoing employee. This template calculates standard withholdings (federal/state tax, FICA) and is suitable for most traditional employment relationships with a consistent schedule."
  },
]

General steps to finish the site:
---------------------------------
Complete data entry pre screen and save to DB.
make sure you can save and load user and company details from the DB
display back to form

user for this repo should be GoldenTechKSA@hotmail.com

Deployment:
-----------
The site is deployed to a Hostinger VPS (Apache2) by a GitHub Actions workflow
on push to master. Full setup and server steps are in docs/deploy/DEPLOYMENT.md.