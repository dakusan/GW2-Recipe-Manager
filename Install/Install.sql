CREATE TABLE IF NOT EXISTS Recipes (
  ID int(10) unsigned NOT NULL,
  OutputItemID int(10) unsigned NOT NULL,
  RecipeTypeID tinyint(3) NOT NULL,
  OutputItemCount tinyint(3) unsigned NOT NULL,
  TimeToCraftMS mediumint(5) unsigned NOT NULL,
  MinRating mediumint(5) unsigned NOT NULL,
  Flags set ('AutoLearned', 'LearnedFromItem') NOT NULL,
  Disciplines set ('Artificer', 'Armorsmith',  'Chef',  'Huntsman',  'Jeweler',  'Leatherworker',  'Tailor',  'Weaponsmith') NOT NULL,
  JSONData text NOT NULL,
  PRIMARY KEY (ID)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS RecipeIngredients (
  RecipeID int(10) unsigned NOT NULL,
  ItemID int(10) unsigned NOT NULL,
  Count tinyint(3) unsigned NOT NULL,
  PRIMARY KEY (RecipeID, ItemID)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS RecipeTypes (
  ID tinyint(3) unsigned auto_increment NOT NULL,
  Category enum ('Weapon', 'Armor', 'Trinket', 'Food', 'Crafting component', 'Refinement', 'Other') NOT NULL,
  Type varchar(20) NOT NULL,
  PRIMARY KEY (ID),
  INDEX (Category)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

CREATE TABLE IF NOT EXISTS Items (
  ID int(10) unsigned NOT NULL,
  VendorValue int(10) unsigned NOT NULL,
  DefaultSkin int(10) unsigned NULL,
  Flags set ('AccountBindOnUse', 'AccountBound', 'HideSuffix', 'MonsterOnly', 'NoMysticForge', 'NoSalvage', 'NoSell', 'NotUpgradeable', 'NoUnderwater', 'SoulbindOnAcquire', 'SoulBindOnUse', 'Unique') NOT NULL,
  Restrictions set ('Asura', 'Charr', 'Human', 'Norn', 'Sylvari', 'Guardian', 'Mesmer', 'Ranger', 'Warrior') NOT NULL,
  GameTypes set ('Activity', 'Dungeon', 'Pve', 'Pvp', 'PvpLobby', 'Wvw') NOT NULL,
  Type enum ('Armor', 'Back', 'Bag', 'Consumable', 'Container', 'CraftingMaterial', 'Gathering', 'Gizmo', 'MiniPet', 'Tool', 'Trait', 'Trinket', 'Trophy', 'UpgradeComponent', 'Weapon') NOT NULL,
  Rarity enum ('Junk', 'Basic', 'Fine', 'Masterwork', 'Rare', 'Exotic', 'Ascended', 'Legendary') NOT NULL,
  Level tinyint(3) unsigned NOT NULL,
  Name varchar(80) NOT NULL,
  IconURL varchar(100) NOT NULL,
  Description TEXT NULL,
  JSONData text NOT NULL,
  PRIMARY KEY (ID),
  KEY (Name)
) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;