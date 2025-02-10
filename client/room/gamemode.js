// Импорты:
import * as Basic from 'pixel_combats/basic';
import * as Room from 'pixel_combats/room';

try 

// Константы, таймера - игры:
const EndOfMatchTime = 11;
const GameModeTime = 181;
const SetVoteTime = 15;

// Константы, имён:
const GameModeStateValue = 'Game';
const EndOfMatchStateValue = 'EndOfMatch';
const EndAreaTag = 'ParcourEnd'; 	// Тэг зоны, конца паркура.
const SpawnAreasTag = 'Spawn';	// Тэг зон, промежуточных - спавнов.
const EndTriggerPoints = 100000;  // Сколько даётся, очков за завершение - маршрута.
const CurSpawnPropName = 'CurSpawn'; // Свойство, отвечающее за индекс - текущего спавна 0 - дефолтный, спавн.
const ViewSpawnsParameterName = 'ViewSpawns';  // Параметр, создания комнаты, отвечающий за визуализацию - спавнов.
const ViewEndParameterName = 'ViewEnd';	// Параметр - создания комнаты, отвечающий за визуализацию, конца - маршрута.
const MaxSpawnsByArea = 25;	// Макс спавнов, на - зону.
const LeaderBoardProp = 'Leader'; // Свойство, для - лидерборда.

// Постоянные, переменные:
let BlueTeam = Room.Teams.Get('Blue');
let MainTimer = Room.Timers.GetContext().Get('Main'); 		// Таймер, конца - игры.
let EndAreas = Room.AreaService.GetByTag('EndAreaTag');		// Зоны, конца - игры.
let SpawnAreas = Room.AreaService.GetByTag('SpawnAreasTag');	// Зоны - спавнов.
let StateProp = Room.Properties.GetContext().Get('State');	// Свойство, состояния.
let Inventory = Room.Inventory.GetContext(); // Контекст - инвентаря.
let BlueColor = new Basic.Color(0, 0, 1, 0);     // Цвет, для конец - зоны.
let WhiteColor = new Basic.Color(1, 1, 1, 1); // Цвет, для - чикпоинтов, зон.

// Опции:
const MapRotation = Room.GameMode.Parameters.GetBool('MapRotation'); 
Room.Properties.GetContext().GameModeName.Value = 'GameModes/Parcour';
Rooom.Damage.GetContext().FriendlyFire = false;
Room.Map.Rotation = MapRotation;
Room.BreackGraph.OnlyPlayerBlocksDmg = GameMode.Parameters.GetBool('PartialDesruction');
Room.BreackGraph.WeakBlocks = GameMode.Parameters.GetBool('LoosenBlocks');

// Конфигурация, инвентаря:
Inventory.Main.Value = false;
Inventory.Secondary.Value = false;
Inventory.Melee.Value = false;
Inventory.Explosive.Value = false;
Inventory.Build.Value = false;
Inventory.BuildInfinity.Value = false;
	
// Стандартная - команда:
Room.Teams.Add('Blue', '<b><size=30><color=#0d177c>ß</color><color=#03088c>l</color><color=#0607b0>ᴜ</color><color=#1621ae>E</color></size></b>', new Basic.Color(0, 0, 1, 0));
BlueTeam.Spawns.SpawnPointsGroups.Add(1);
BlueTeam.Spawns.RespawnTime.Value = 5;

// Вывод, подсказки:
 Room.Ui.GetContext(BlueTeam).Hint.Value = '!Пройдите: маршрут, до - конца!';
if (Room.GameMode.Parameters.GetBool('EnHint')) {
 Room.Ui.GetContext(BlueTeam).Hint.Value = 'Proydite: route, to - the end!';
}

// Настройки, игровых - переключателей:
StateProp.OnValue.Add(OnState);
function OnState() {
 switch (StateProp.Value) {
case GameModeStateValue:
 StateProp.Value = GameModeStateValue;
 Room.Spawns.GetContext().Enable = true;
 MainTimer.Restart(GameModeTime);
break;
case EndOfMatchStateValue: // После входа в конец зону, то деспавним игрока:  
StateProp.Value = EndOfMatchStateValue;			
Room.Spawns.GetContext().Enable = false;
Room.Spawns.GetContext().Despawn();	                
Room.Game.GameOver(Room.LeaderBoard.GetTeams());
MainTimer.Restart(EndOfMatchTime);
// Говорим, кто выиграл - раунд:
	   break;
      }
}

// Триггер, конца - раунда:
CreateNewArea('EndTrigger', ['EndAreaTag'], true, function(Player) {
 Player.Properties.Get('LeaderBoardProp').Value += 100000;
EndTrigger.Enable = false;
  StateProp.Value = EndOfMatchStateValue;
}, function(Player) {}, 'EndTriggerView', new Basic.Color(0, 0, 1, 0), true);

// Триггер, промежуточной - сохранения:
var spawnTrigger = AreaPlayerTriggerService.Get("SpawnTrigger");
spawnTrigger.Tags = [SpawnAreasTag];
spawnTrigger.Enable = true;
spawnTrigger.OnEnter.Add(function(player, area) {
	if (spawnAreas == null || spawnAreas.length == 0) InitializeMap(); // Todo костыль, изза - бага (Не всегда, прогружает - нормально).
	if (spawnAreas == null || spawnAreas.length == 0) return;
	var prop = player.Properties.Get(CurSpawnPropName);
	var startIndex = 0;
	if (prop.Value != null) startIndex = prop.Value;
	for (var i = startIndex; i < spawnAreas.length; ++i) {
		if (spawnAreas[i] == area) {
			var prop = player.Properties.Get(CurSpawnPropName);
			if (prop.Value == null || i > prop.Value) {
				prop.Value = i;
				player.Properties.Get(LeaderBoardProp).Value += 10;
			}
			break;
		}
	}
});

// Таймер, для конца - раунда:
mainTimer.OnTimer.Add(function () { Game.RestartGame(); });

// Задаём, лидерБорды:
LeaderBoard.PlayerLeaderBoardValues = [
	{
		Value: "Deaths",
		DisplayName: "<b><size=30><color=#be5f1b>D</color><color=#ba591a>ᴇ</color><color=#b65319>ᴀ</color><color=#b24d18>ᴛ</color><color=#ae4717>ʜ</color><color=#aa4116>s</color></size></b>",
		ShortDisplayName: "<b><size=30><color=#be5f1b>D</color><color=#ba591a>ᴇ</color><color=#b65319>ᴀ</color><color=#b24d18>ᴛ</color><color=#ae4717>ʜ</color><color=#aa4116>s</color></size></b>"
	},
	{
		Value: LeaderBoardProp,
		DisplayName: "<b><size=30><color=#be5f1b>S</color><color=#ba591a>ᴄ</color><color=#b65319>ᴏ</color><color=#b24d18>ʀ</color><color=#ae4717>ᴇ</color><color=#aa4116>s</color></size></b>",
		ShortDisplayName: "<b><size=30><color=#be5f1b>S</color><color=#ba591a>ᴄ</color><color=#b65319>ᴏ</color><color=#b24d18>ʀ</color><color=#ae4717>ᴇ</color><color=#aa4116>s</color></size></b>"
	},
	{
	       Value: "Spawns",
	       DisplayName: "<b><size=30><color=#be5f1b>S</color><color=#ba591a>ᴘ</color><color=#b65319>ᴀ</color><color=#b24d18>ᴡ</color><color=#ae4717>ɴ</color><color=#aa4116>s</color></size></b>",
	       ShortDisplayName: "<b><size=30><color=#be5f1b>S</color><color=#ba591a>ᴘ</color><color=#b65319>ᴀ</color><color=#b24d18>ᴡ</color><color=#ae4717>ɴ</color><color=#aa4116>s</color></size></b>"
	}
];
// Сортировочные, команды:
LeaderBoard.TeamLeaderBoardValue = {
	Value: LeaderBoardProp,
	DisplayName: "Statistics\Scores",
	ShortDisplayName: "Statistics\Scores"
};
// Вес, игрока в - лидерБорде:
LeaderBoard.PlayersWeightGetter.Set(function(player) {
	return player.Properties.Get(LeaderBoardProp).Value;
});
// Счётчик, смертей:
Damage.OnDeath.Add(function(player) {
	++player.Properties.Deaths.Value;
});
// Счётчик, спавнов:
Spawns.OnSpawn.Add(function(player) {
        ++player.Properties.Spawn.Value;
});

// Вход в команды, по - запросу:
Teams.OnRequestJoinTeam.Add(function(player, team) { team.Add(player); });
// Сравним игрока, по - запросу: 
Teams.OnPlayerChangeTeam.Add(function(player) { player.Spawns.Spawn() });

// Инициализация всего, что зависит - от карты:
Map.OnLoad.Add(InitializeMap);
function InitializeMap() {
	endAreas = AreaService.GetByTag(EndAreaTag);
	spawnAreas = AreaService.GetByTag(SpawnAreasTag);
	log.debug("spawnAreas.length=" + spawnAreas.length);
	// Ограничитель:
	if (spawnAreas == null || spawnAreas.length == 0) return;
	// Сортировка, зон:
	spawnAreas.sort(function(a, b) {
		if (a.Name > b.Name) return 1;
		if (a.Name < b.Name) return -1;
		return 0;
	});
}
InitializeMap();

// При смене - свойства индекса спавна, задаем - спавн:
Properties.OnPlayerProperty.Add(function(context, prop) {
	if (prop.Name != CurSpawnPropName) return;
	log.debug(context.Player + " spawn point is " + prop.Value);
	SetPlayerSpawn(context.Player, prop.Value);
});

function SetPlayerSpawn(player, index) {
	var spawns = Spawns.GetContext(player);
	// Очистка, - спавнов:
	spawns.CustomSpawnPoints.Clear();
	// Если нет захвата, то сброс - спавнов:
	if (index < 0 || index >= spawnAreas.length) return;
	// Задаём, спавны:
	var area = spawnAreas[index];
	var iter = area.Ranges.All[0];
	iter.MoveNext();
	var range = iter.Current;
	// Определяем, куда смотреть - спавнам:
	var lookPoint = {};
	if (index < spawnAreas.length - 1) lookPoint = spawnAreas[index + 1].Ranges.GetAveragePosition();
	else {
		if (endAreas.length > 0)
			lookPoint = endAreas[0].Ranges.GetAveragePosition();
	}

	log.debug("range=" + range);
	var spawnsCount = 0;
	for (var x = range.Start.x; x < range.End.x; x += 2)
		for (var z = range.Start.z; z < range.End.z; z += 2) {
			spawns.CustomSpawnPoints.Add(x, range.Start.y, z, Spawns.GetSpawnRotation(x, z, lookPoint.x, lookPoint.z));
			++spawnsCount;
			if (spawnsCount > MaxSpawnsByArea) return;
		}
}

// Запуск - игры:
stateProp.Value = GameStateValue;

} catch (e) {
        Players.All.forEach(p => {
                msg.Show(`${e.name}: ${e.message} ${e.stack}`);
        });
}
