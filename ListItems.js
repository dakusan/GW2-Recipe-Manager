var ColNames={'ColNum':'Num', 'UserToggles':'User Toggles', 'OutputItem':'Item', 'Type':'Recipe Type', 'Disciplines':'Disciplines', 'MinRating':'Min Rate', 'Flags':'Flags', 'Rarity':'Rarity', 'Level':'Level', 'Ingredients':'Ingredients', 'Value':'Value', 'ItemFlags':'Item Flags', 'GameTypes':'Game Types', 'TimeToCraft':'Craft Time'};
$(document).ready(function() {
	//Process incoming JSON data
	RearrangeJSONData('Recipes');
	RearrangeJSONData('RecipeTypes');
	RearrangeJSONData('Items');

	//Create filter lists
	Enum_Disciplines.unshift('');
	Enum_Flags.unshift('');
	$.each(['Disciplines', 'Flags', 'Rarity', 'ItemFlags', 'GameTypes'], function(Dummy, FilterName) {
		var FilterItems=[];
		$.each(window['Enum_'+FilterName], function(Index, ToggleName) {
			FilterItems.push($('<label>').append([$('<input type=checkbox checked>').val(ToggleName), $('<span>').text(ToggleName), $('<br>')]));
		});
		$('#FilterToggles_'+FilterName).html('').append(FilterItems);
	});
	$('#FilterToggles_ItemFlags input[type="checkbox"]').prop('checked', false); //Since these filters are required whewn checked, do not allow them to be checked by default

	//Filter list for recipe types
	var FilterItems=[];
	$.each(RecipeTypes, function(ID, Data) {
		FilterItems.push($('<label>').append([$('<input type=checkbox checked>').val(ID), $('<span>').text(Data.Type), $('<br>')]));
	});
	var FilterTypeSplit=Math.ceil(FilterItems.length/2);
	$('#FilterToggles_Type').html('').append($('<table>').append($('<tr>').append([
		$('<td>').append(FilterItems.slice(0, FilterTypeSplit)),
		$('<td>').append(FilterItems.slice(FilterTypeSplit)),
	])));

	//"Toggle All" buttons
	$('a[id^="CheckAll_"]').click(function(e) {
		e.preventDefault();
		var ID=$(this).attr('id').split(/_/g); //['CheckAll', TYPE, TOGGLESTATE]
		$('#FilterToggles_'+ID[1]+' input[type="checkbox"]').prop('checked', ID[2]=='On');
	});

	//Fill in sorting
	for(var i=1;i<=3;i++)
	{
		$('#SortBy'+i).children().remove();
		$('#SortBy'+i).append($.map(ColNames, function(Title, Name) {
			return $.inArray(Name, ['ColNum', 'UserToggles'])!=-1 ? null : $('<option>').text(Title).val(Name);
		}));
	}
	$('#SortBy1').val('Disciplines');
	$('#SortBy2').val('MinRating');
	$('#SortBy3').val('OutputItem');

	//Filter form submit
	$('#FilterForm').submit(function(e) {
		e.preventDefault();
		RenderTable();
	});

	//Restore the saved user toggles
	var SUT=[{},{},{},{}];
	var NumCookies=GetCookie('Recipes_NumCookies');
	if(NumCookies!==null)
	{
		SUT=[];
		for(var i=0;i<NumCookies;i++)
			SUT.push(GetCookie('Recipes_Part'+i));
		SUT=JSON.parse(SUT.join(''));
	}
	window.SavedUserToggles=SUT;
	$('#UserToggleList').val(JSON.stringify(SUT));
	$.each(SUT, function(ToggleIndex, List) {
		$.each(List, function(RecipeID, _) {
			var Recipe=Recipes[RecipeID];
			if(Recipe.Toggles===undefined)
				Recipe.Toggles=[0,0,0,0];
			Recipe.Toggles[ToggleIndex]=1;
		});
	});

	//Now everything has been loaded, do the first render of the data
	RenderTable();
});

function RenderTable()
{
	//Clear and detach the table for render
	var TheTableParent=$('#DataTable')
	var TheTable=TheTableParent.children();
	var NewRows=[]; //Holds the base data that will be sorted then rendered
	TheTable.children().remove();
	TheTable.detach();
	$('#Loading').toggleClass('Show', true); //Show the loading object

	//Do the actual render after a delay so the loading object can show
	setTimeout(function() {
		//Create the table's header row
		var Header=[];
		$.each(ColNames, function(Name, Title) {
			if($('#ToggleCol_'+Name).is(':checked'))
				Header.push($('<th>').text(Title));
		});
		TheTable.append($('<tr>').append(Header));

		//Gather the filters processed from strings (regexs and min/maxes)
		var SearchString_ItemName=GetFilterString('ItemName');
		var SearchString_Incredients=$.map([1,2,3,4], function(Index) { return GetFilterString('Ingredients'+Index); });
		var MinMax_Rating=GetFilterMinMax('Rating');
		var MinMax_Level=GetFilterMinMax('Level');
		var MinMax_Value=GetFilterMinMax('Value');
		var MaxResultsFilter=$('#Filter_MaxResults').val();
		MaxResultsFilter=(MaxResultsFilter=='' ? false : parseInt(MaxResultsFilter, 10));

		//Gather the enum filter data
		var EnumsData={};
		$.each(['Type', 'Disciplines', 'Flags', 'Rarity', 'ItemFlags', 'GameTypes'], function(Dummy, FilterName) {
			EnumsData[FilterName]=$('#FilterToggles_'+FilterName+' input:checked').map(function(_, Val) { return $(Val).val(); });
		});

		//Gather the user toggles filters
		var UserTogglesFilter=$('#UserToggle_OnList input,#UserToggle_OffList input').map(function() { return $(this).is(':checked'); });

		//Create the table's items
		$.each(Recipes, function(ID, Recipe) {
			//Create a fake item if linked output item is not found
			var OutputItemData=Items[Recipe.OutputItemID];
			if(OutputItemData===undefined)
			{
				OutputItemData={};
				$.each(['Name', 'Level', 'VendorValue', 'Rarity', 'Flags', 'GameTypes'], function(_, Name) {
					OutputItemData[Name]='???';
				});
			}

			//Check the string filters
			if(
				!CheckFilterString(OutputItemData.Name, SearchString_ItemName) ||
				!CheckFilterMinMax(Recipe.MinRating, MinMax_Rating) ||
				!CheckFilterMinMax(OutputItemData.Level, MinMax_Level) ||
				!CheckFilterMinMax(OutputItemData.VendorValue, MinMax_Value)
			)
				return;

			//Get the ingredients
			var Ingredients=[];
			$.each(Recipe.Ingredients.split(/,/g), function(Index, Data) {
				Data=Data.split(/:/);
				Ingredients.push(Data[1]+' '+(Items[Data[0]]===undefined ? '???' : Items[Data[0]].Name));
			});

			//Check the ingredients filter
			var CombinedIngredients=Ingredients.join("\n");
			for(var i=0;i<4;i++)
				if(!CheckFilterString(CombinedIngredients, SearchString_Incredients[i]))
					return;

			//Check the enum filters
			var EnumFailed=false;
			$.each({
				Type:		Recipe.RecipeTypeID+'',
				Disciplines:	Recipe.Disciplines,
				Flags:		Recipe.Flags,
				Rarity:		OutputItemData.Rarity,
				GameTypes:	OutputItemData.GameTypes
			}, function(FilterName, Value) {
				var MyVals=Value.split(/,/g); //The given values for this item
				for(var i=0;i<MyVals.length;i++)
					if($.inArray(MyVals[i], EnumsData[FilterName])!=-1) //If match found
						return; //Move onto next enum check

				//If match not found, exit item compltely
				EnumFailed=true;
				return false; //Stop the foreach loop
			});
			if(EnumFailed)
				return;

			//Check the item flags (checked flags are required)
			var ItemTypeFlags=OutputItemData.Flags.split(/,/g);
			for(var i=0;i<EnumsData.ItemFlags.length;i++)
				if($.inArray(EnumsData.ItemFlags[i], ItemTypeFlags)==-1)
					return;

			//Check the user toggles
			var MyToggles=(Recipe.Toggles!==undefined ? Recipe.Toggles : [0,0,0,0]);
			for(var i=0;i<4;i++)
				if(
					(UserTogglesFilter[i] && !MyToggles[i]) ||
					(UserTogglesFilter[i+4] && MyToggles[i]) )
						return;

			//Render use toggles
			var UserToggles=$.map([0,1,2,3], function(_, Index) {
				return $('<input type=checkbox class=UserToggle>').attr('id', 'UT_'+ID+'_'+Index).prop('checked', MyToggles[Index]);
			});

			//Create the items
			var ItemColumns={
				UserToggles:	UserToggles,
				OutputItem:	OutputItemData.Name+' ('+Recipe.OutputItemCount+')',
				Type:		RecipeTypes[Recipe.RecipeTypeID].Type,
				Disciplines:	SpaceList(Recipe.Disciplines),
				MinRating:	Recipe.MinRating,
				Flags:		Recipe.Flags,
				Rarity:		OutputItemData.Rarity,
				Level:		OutputItemData.Level,
				Ingredients:	$.map(Ingredients, function(Text) { return $('<div>').text(Text); }),
				Value:		OutputItemData.VendorValue,
				ItemFlags:	SpaceList(OutputItemData.Flags),
				GameTypes:	SpaceList(OutputItemData.GameTypes),
				TimeToCraft:	Recipe.TimeToCraftMS
			};
			NewRows.push(ItemColumns);
		});

		//Sort the rows
		var SortData=$.map([1,2,3], function(Index) {
			return [[$('#SortBy'+Index).val(), $('#SortBy'+Index+'Dir').val()=='ASC' ? 1 : -1]]; });
		NewRows.sort(function(a,b) {
			for(var i=0;i<3;i++)
				if(a[SortData[i][0]]!=b[SortData[i][0]])
					return (a[SortData[i][0]]<b[SortData[i][0]] ? -1 : 1) * SortData[i][1];
			return 0;
		});

		//Add the items to the table
		MaxResultsFilter=(MaxResultsFilter!==false ? MaxResultsFilter : NewRows.length);
		for(var i=0;i<MaxResultsFilter;i++)
		{
			var NewRow=$('<tr>').appendTo(TheTable);
			$.each($.extend({ColNum:i+1}, NewRows[i]), function(FilterName, Value) {
				if($('#ToggleCol_'+FilterName).is(':checked')) //Only create if the visibility toggle is on
					NewRow.append($('<td>')[Value instanceof Array ? 'append' : 'text'](Value));
			});
		}
		NewRows=null; //Clear the gathered data

		//Reattach the table
		$('#Loading').toggleClass('Show', false);
		TheTableParent.append(TheTable);

		//Set up the user toggle buttons
		$('.UserToggle').click(function(e) {
			//Gather info from the checkbox element
			var IDInfo=$(this).attr('id').split(/_/g), RecipeID=IDInfo[1], ToggleIndex=IDInfo[2], IsToggled=$(this).is(':checked');

			//Save to the recipe list
			var Recipe=Recipes[RecipeID];
			if(Recipe.Toggles===undefined)
				Recipe.Toggles=[0,0,0,0];
			Recipe.Toggles[ToggleIndex]=IsToggled;

			//Update to the saved user toggles list
			if(IsToggled)
				window.SavedUserToggles[ToggleIndex][RecipeID]=1;
			else
				delete window.SavedUserToggles[ToggleIndex][RecipeID];
			var SaveVal=JSON.stringify(window.SavedUserToggles);
			$('#UserToggleList').val(SaveVal);

			//Save the list to cookies
			var MaxCookieLen=1000, NumCookies=Math.ceil(SaveVal.length/MaxCookieLen), SaveCookieTime=20*365*24*60*60; //Save for 20 years
			SetCookie('Recipes_NumCookies', NumCookies);
			for(var i=0;i<NumCookies;i++)
				SetCookie('Recipes_Part'+i, SaveVal.slice(i*MaxCookieLen, i*MaxCookieLen+MaxCookieLen));
		});
	}, 1);
}

//Filter min/max checks
function GetFilterMinMax(FilterName) //Gather
{
	var Min=$('#Filter_Min'+FilterName).val();
	var Max=$('#Filter_Max'+FilterName).val();
	return [Min=='' ? false : parseInt(Min, 10), Max=='' ? false : parseInt(Max, 10)];
}
function CheckFilterMinMax(Val, MinMaxVals) //Compare
{
	return (MinMaxVals[0]===false || MinMaxVals[0]<=Val) && (MinMaxVals[1]===false || MinMaxVals[1]>=Val);
}

//Filter string checks
function GetFilterString(FilterName) //Gather
{
	var Str=$('#Filter_'+FilterName).val();
	return Str=='' ? false : new RegExp(Str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"), 'i');
}
function CheckFilterString(Val, FilterStr) //Compare
{
	return (FilterStr===false || Val.search(FilterStr)!=-1);
}

//Process data into associative arrays
function RearrangeJSONData(Name)
{
	//Make rows associative by column names
	var NewData={}, ColNames=window[Name][0], RowVals=window[Name][1];
	$.each(RowVals, function(Index, Val) {
		var Row=RowVals[Index];
		var NewRow={};
		for(var c=0;c<ColNames.length;c++)
			NewRow[ColNames[c]]=Row[c];
		NewData[NewRow.ID]=NewRow;
	});

	//Save data globally
	window[Name]=NewData;
	window[Name+'ColNames']=ColNames;
}

//Add spaces after commas
function SpaceList(String) { return String.replace(/,/g, ', '); }