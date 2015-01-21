<?
require_once('Config.php');
require_once('Scripts/DSQL.php');
new DSQL();

//Load data from API
print "Loading items<br>";
LoadFromAPI('items', 'name', 'Items');

print "Loading Recipes<br>";
LoadFromAPI('recipes', 'type', 'Recipes');

print "Parsing Items<br>";
ParseItems();

print "Parsing Recipes<br>";
ParseRecipes();

function LoadFromAPI($APIType, $SeparatorField, $DBTableName)
{
	//Process items in batches
	$BatchCount=100;
	$ItemIDs=json_decode(file_get_contents("https://api.guildwars2.com/v2/$APIType/"), true); //Load item IDs
	for($i=0;$i<count($ItemIDs);$i+=$BatchCount)
	{
		$Items=file_get_contents("https://api.guildwars2.com/v2/$APIType/?ids=".implode(',', array_slice($ItemIDs, $i, $BatchCount))); //Get all of the the items' data
		$Items=explode('},{"'.$SeparatorField.'"', substr($Items, 1, -1)); //Remove array brackets around list of items and split into separate items
		$QueryItems=Array();
		foreach($Items as $Index => $ItemString) //Process each item
		{
			$ItemString=($Index==0 ? '' : '{"'.$SeparatorField.'"').$ItemString.($Index==count($Items)-1 ? '' : '}'); //Readd the item separator text
			$ItemData=json_decode($ItemString);
			array_push($QueryItems, $ItemData->id, $ItemString);
		}
		DSQL::Query("INSERT INTO $DBTableName (ID, JSONData) VALUES ".implode(', ', array_fill(0, count($QueryItems)/2, '(?, ?)')), $QueryItems);
	}
}

function ParseItems()
{
	//Get Enums
	foreach(Array('Type', 'Rarity', 'Flags', 'GameTypes', 'Restrictions') as $EnumName)
		${$EnumName}=GetDBFieldEnums('Items', $EnumName);

	//Batch queries
	DSQL::Query('ALTER TABLE Items ENGINE=InnoDB');
	DSQL::Query('START TRANSACTION');

	//Process items
	foreach(DSQL::Query('SELECT ID, JSONData FROM Items')->FetchAll() as $Item)
	{
		//Confirm the data
		$ItemData=json_decode($Item['JSONData'], true);
		if($ItemData===NULL)
			exit("Cannot decode Item #$Item[ID]");

		//Store the recipe information
		$QueryData=Array(
			'Name'		=>$ItemData['name'],
			'IconURL'	=>$ItemData['icon'],
			'Description'	=>DefaultOnEmpty($ItemData, 'description', NULL),
			'Type'		=>ProcessEnumList('Type', $Type, $ItemData['type']),
			'Rarity'	=>ProcessEnumList('Rarity', $Rarity, $ItemData['rarity']),
			'Level'		=>$ItemData['level'],
			'VendorValue'	=>$ItemData['vendor_value'],
			'DefaultSkin'	=>DefaultOnEmpty($ItemData, 'default_skin', 0),
			'Flags'		=>ProcessEnumList('Flags', $Flags, $ItemData['flags']),
			'GameTypes'	=>ProcessEnumList('GameTypes', $GameTypes, $ItemData['game_types']),
			'Restrictions'	=>ProcessEnumList('Restrictions', $Restrictions, $ItemData['restrictions']),
		);
		DSQL::Query('UPDATE Items SET '.DSQL::PrepareUpdateList(array_keys($QueryData)).' WHERE ID=?', $QueryData, $ItemData['id']);
	}

	//End query batch
	DSQL::Query('COMMIT');
	DSQL::Query('ALTER TABLE Items ENGINE=MyISAM');
}

function ParseRecipes()
{
	//Preparation
	$RecipeTypes=DSQL::Query('SELECT Type, ID FROM RecipeTypes')->GetKeyed();
	DSQL::Query('TRUNCATE TABLE RecipeIngredients');
	$Disciplines=GetDBFieldEnums('Recipes', 'Disciplines');
	$Flags=GetDBFieldEnums('Recipes', 'Flags');

	//Batch queries
	DSQL::Query('ALTER TABLE Recipes ENGINE=InnoDB');
	DSQL::Query('ALTER TABLE RecipeIngredients ENGINE=InnoDB');
	DSQL::Query('START TRANSACTION');

	//Process recipes
	foreach(DSQL::Query('SELECT ID, JSONData FROM Recipes')->FetchAll() as $Item)
	{
		//Confirm the data
		$ItemData=json_decode($Item['JSONData'], true);
		if($ItemData===NULL)
			exit("Cannot decode Recipe #$Item[ID]");

		//Store the recipe information
		$QueryData=Array(
			'RecipeTypeID'		=>$RecipeTypes[$ItemData['type']],
			'OutputItemID'		=>$ItemData['output_item_id'],
			'OutputItemCount'	=>$ItemData['output_item_count'],
			'TimeToCraftMS'		=>$ItemData['time_to_craft_ms'],
			'MinRating'		=>$ItemData['min_rating'],
			'Flags'			=>ProcessEnumList('Flags', $Flags, $ItemData['flags']),
			'Disciplines'		=>ProcessEnumList('Disciplines', $Disciplines, $ItemData['disciplines'])
		);
		DSQL::Query('UPDATE Recipes SET '.DSQL::PrepareUpdateList(array_keys($QueryData)).' WHERE ID=?', $QueryData, $ItemData['id']);

		//Store the ingredients
		$Ingredients=Array();
		foreach($ItemData['ingredients'] as $Ingredient)
			array_push($Ingredients, $ItemData['id'], $Ingredient['item_id'], $Ingredient['count']);
		if(count($Ingredients))
			DSQL::Query('INSERT INTO RecipeIngredients (RecipeID, ItemID, Count) VALUES '.implode(', ', array_fill(0, count($Ingredients)/3, '(?, ?, ?)')), $Ingredients);
	}

	//End query batch
	DSQL::Query('COMMIT');
	DSQL::Query('ALTER TABLE RecipeIngredients ENGINE=MyISAM');
	DSQL::Query('ALTER TABLE Recipes ENGINE=MyISAM');
}

//Enum and variable functions
function ProcessEnumList($Name, $ValidValues, $List) //Check enum values and return as stringified list
{
	if(is_string($List)) //Turn a string into an array with 1 item
		$List=Array($List);
	if(count(array_intersect($List, $ValidValues))==count($List)) //If all items are valid, return the stringified list
		return implode(',', $List);
	exit('Invalid values in "'.$Name.'" enum: '.implode(', ', $List));
}
function GetDBFieldEnums($Table, $Field)
{
	$Enums=DSQL::Query("SHOW COLUMNS FROM $Table WHERE Field=?", $Field)->FetchRow(0)['Type'];
	return explode("','", substr($Enums, strpos($Enums, '(')+2, -2));
}
function DefaultOnEmpty($Array, $Key, $Default)
{
	return isset($Array[$Key]) ? $Array[$Key] : $Default;
}
?>