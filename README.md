GW2 Recipe Manager - v1.0.0.0 http://www.castledragmire.com/Projects/GW2_Recipe_Manager<br>
GitHub Page - http://www.github.com/dakusan/GW2-Recipe-Manager

#Description
**An interface to manage Recipes for Guild Wars 2. The interface allows filtering and sorting recipes by many variables. It also has user toggleable checkboxes per recipe that you can use to group and filter recipes. For example, all recipes with the first checkbox selected might be recipes your primary character already knows.**

This project has 2 parts. The first pulls all of the Item and Recipe info for Guild Wars 2 into a database. The second is a client side only recipe management interface (no server processing).

I threw this together for a friend in 8 hours, as some of its functionality coincided with stuff I needed for another one of my projects. It was not meant to be pretty, so the interface is a bit spartan, and the code comments are a bit lacking. It also doesn’t check user input very thoroughly :-) .

#Features
* The following fields are shown per recipe:
  * 4 user toggles
  * Recipe Info: Type, Disciplines, Minimum Rating, Flags (AutoLearned/LearnedFromItem), Ingredients, Time To Craft
  * Output Item Info: Name, Rarity, Level, Vendor Value, Flags, Usable Game Types
* All of these fields can be used as search filters for the recipe list
* All field columns can be hidden (via the checkbox next to their filter label)
* Results can be limited to a maximum amount. Do note that if you clear this filter and have it show all the recipes, it might take a while for your browser to render it. I only tested these large data sets in Google Chrome.
* Recipes can be sorted by all fields except for the user toggles
* User toggles are saved via cookies (not too thoroughly tested). The user toggle value list is also shown in a textbox on the interface, for manual copy+backup purposes.
* Since all recipes are stored, sorted, and handled via the browser, this can become a bit memory intensive (a few hundred megs in Chrome)

![Screenshot](http://www.castledragmire.com/ProjectContent/GW2RecipeManager/Screenshot.png)

#Install
1. Create your database and run all sql files in the “Install” directory in it
2. Rename “Config.php.default” to “Config.php” and add your database information into it
3. Execute RetrieveAPIData.php via your web browser or PHP CLI. You might need to up your PHP’s max_execution_time for it
4. Execute GenerateJSData.php via your web browser or PHP CLI
5. Run ListItems.html via your web browser
* Note: Since the php files are not required to run the interface, they can be removed once the "ItemData.js" has been generated.

#Files
* __Install/*.sql__:
  * The install files
* __RetrieveAPIData.php__:
  * Pulls the info from the Guild Wars 2 API into the database using http requests.
  * It polls the GW2 API serially 100 items at a time. Since there are currently ~9k recipes and ~40k items, and each query takes around a second, this takes some time to run (8-10 minutes for me).
* __GenerateJSData.php__:
  * Export all the data in the DB relevant to the Recipe Management Interface into ItemData.js.
  * Because of this, the recipe management interface does not need any server side processing.
  * The JS data is in the following format:
    * An Array of 2 items: An array of the column names, and then an array each of the row’s data (which is itself an array)
    ```
    [
      [Col1Name,Col2Name,...],
      [
        [Row1Col1,Row1Col2,...],
        [Row2Col1,Row2Col2,...],
        ...
      ]
    ]
    ```
    * Doing it this way, instead of having each row as an object/associative array, seriously cuts back on the file size.
    * Numbers are also not stringified.
* __ListItems.html__: The interface design for the Recipe Management Interface
* __ListItems.js__: The code for the Recipe Management Interface
* __Config.php.default__: Database configuration (Rename to __Config.php__)
* __Scripts/__: See the “Dependencies” section

#Live Version (Management Interface Only)
http://www.castledragmire.com/ProjectContent/GW2RecipeManager/Live/ListItems.html

#Dependencies
* DSQL (for the data gathering portion): A MySQL library for PHP, see http://www.castledragmire.com/Projects/DSQL
* jQuery (for the client interface): v1.11.2.min included
* Cookies.js: Get and set cookies

Copyright and coded by Dakusan - See http://www.castledragmire.com/Copyright for more information.