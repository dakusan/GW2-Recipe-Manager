<?
require_once('Config.php');
require_once('Scripts/DSQL.php');
new DSQL();

function GetJson($Query, $NumericFields)
{
	//Get the field names
	$Result=DSQL::CleanQuery($Query);
	$Row=$Result->FetchNext();
	$OutputKeys=array_keys($Row);

	//Get the row indexes that are numeric
	$NumericIndexes=Array();
	foreach(explode(',', $NumericFields) as $FieldName)
		$NumericIndexes[]=array_search($FieldName, $OutputKeys);

	//Strip down to parallel arrays
	do
	{
		$Row=array_values($Row);
		foreach($NumericIndexes as $NI)
			$Row[$NI]+=0;
		$OutputData[]=$Row;
	} while(($Row=$Result->FetchNext()));

	return json_encode(Array($OutputKeys, $OutputData));
}
function GetDBFieldEnums($Table, $Field)
{
	$Enums=DSQL::Query("SHOW COLUMNS FROM $Table WHERE Field=?", $Field)->FetchRow(0)['Type'];
	return explode("','", substr($Enums, strpos($Enums, '(')+2, -2));
}
ob_start();
?>
var Recipes=<?=GetJson('
	SELECT
		R.ID, R.RecipeTypeID, R.OutputItemID, R.OutputItemCount, R.TimeToCraftMS, R.MinRating, R.Flags, R.Disciplines, GROUP_CONCAT(RI.ItemID, ":", RI.Count) AS Ingredients
		FROM Recipes AS R
		INNER JOIN RecipeIngredients AS RI ON RI.RecipeID=R.ID
		GROUP BY R.ID
	', 'ID,RecipeTypeID,OutputItemID,OutputItemCount,TimeToCraftMS,MinRating')?>;
var RecipeTypes=<?=GetJson('SELECT ID, Type FROM RecipeTypes', 'ID')?>;
var Items=<?=GetJson('SELECT ID, Name, Rarity, Level, VendorValue, Flags, GameTypes FROM Items', 'ID,Level,VendorValue')?>;
<?
foreach(Array('Disciplines'=>'Recipes.Disciplines', 'Flags'=>'Recipes.Flags', 'Rarity'=>'Items.Rarity', 'ItemFlags'=>'Items.Flags', 'GameTypes'=>'Items.GameTypes') as $Name => $TableData)
{
	$TableData=explode('.', $TableData);
	print "var Enum_$Name=".json_encode(GetDBFieldEnums($TableData[0], $TableData[1])).";\n";
}

file_put_contents('ItemData.js', ob_get_clean());
?>