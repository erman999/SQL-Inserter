# SQL-Query-Repeater
The application is written with **Node.js** and **Electron**. It uses `mysql2` package to communicate with SQL server. 
The typical use case for this repository is to execute SQL queries repetitively within the specified time interval. 

## Dependencies
```
electron
mysql2
```

## Installation
Use `git` and `npm` to install this repository or download repository as zip file, unzip and use `npm` commands to for installation.

```
# Clone this repository
git clone https://github.com/erman999/SQL-Query-Repeater
# Go into the repository
cd SQL-Query-Repeater
# Install dependencies
npm install
# Run the app
npm start
```

## Usage

Run application and click `cog` icon to configure database connection settings.

![Image-1](https://raw.githubusercontent.com/erman999/SQL-Query-Repeater/master/screenshots/Screenshot-1.jpg)

Enter database credentials and click `Save & Test` button. 
If connection is successful you will see `Status` badge will turn to `Connected` status. Otherwise, it will show `Disconnected` and the error message.

⚠️ **WARNING: Database credentials will NOT be crypted.** It will be stored as plain text in `configs/db_config.json`.

![Image-2](https://raw.githubusercontent.com/erman999/SQL-Query-Repeater/master/screenshots/Screenshot-2.jpg)

For repetitive run, check `Repeat` checkbox and enter your time interval. Time interval values must be `millisecond` (i.e. type 3000 for 3 seconds interval). After execution complete result will be printed.

![Image-3](https://raw.githubusercontent.com/erman999/SQL-Query-Repeater/master/screenshots/Screenshot-3.jpg)

⭐ Application will store last executed query in `configs/last_query.txt` on close and will read and print it to query area on start.


## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Licensing
Copyright 2023 Erman İlçin

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
