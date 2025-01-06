import { DisplayValueHeader, Color } from 'pixel_combats/basic';
import { Game, GameMode, Properties, Teams, Damage, BreackGraph, Inventory, Ui, Spawns, LeaderBoard, BuildBlocksSet, AreaPlayerTriggerService, AreaViewService, msg, NewGameVote, NewGame } from 'pixel_combats/room';

try {
	
// Опция, времени:
var EndOfMatchTime = 10;
var SetVoteTime = 20;

// Константы, игры:
var GameStateValue = "Game";
var EndOfMatchStateValue = "EndOfMatch";
var EndAreaTag = "parcourend"; 	// Тэг зоны, конца паркура.
var SpawnAreasTag = "spawn";	// Тэг зон, промежуточных - спавнов.
var EndTriggerPoints = 1000000;	// Сколько даётся, очков за завершение - маршрута.
var CurSpawnPropName = "CurSpawn"; // Свойство, отвечающее за индекс - текущего спавна 0 - дефолтный, спавн.
var ViewSpawnsParameterName = "ViewSpawns";	// Параметр, создания комнаты, отвечающий за визуализацию - спавнов.
var ViewEndParameterName = "ViewEnd";	// Параметр - создания комнаты, отвечающий за визуализацию, конца - маршрута.
var MaxSpawnsByArea = 25;	// Макс спавнов, на - зону.
var LeaderBoardProp = "Leader"; // Свойство, для - лидерборда.

// Постоянные, переменные - триггеров:
var mainTimer = Timers.GetContext().Get("Main"); 		// Таймер, конца - игры.
var endAreas = AreaService.GetByTag("EndAreaTag");		// Зоны, конца - игры.
var spawnAreas = AreaService.GetByTag("SpawnAreasTag");	// Зоны - спавнов.
var stateProp = Properties.GetContext().Get("State");	// Свойство, состояния.
var inventory = Inventory.GetContext(); // Контекст - инвентаря.
var MapRotation = GameMode.Parameters.GetBool("MapRotation"); 
var blueColor = new Color(0, 0, 1, 0);     // Цвет, для конец - зоны.
var whiteColor = new Color(1, 1, 1, 1); // Цвет, для - чикпоинтов, зон.

// Параметры, создания - комнаты:
Properties.GetContext().GameModeName.Value = "GameModes/Parcour";
Damage.GetContext().FriendlyFire = false;
Map.Rotation = MapRotation;
BreackGraph.OnlyPlayerBlocksDmg = GameMode.Parameters.GetBool("PartialDesruction");
BreackGraph.WeakBlocks = GameMode.Parameters.GetBool("LoosenBlocks");

// Запрещаем, инвентарь:
inventory.Main.Value = false;
inventory.Secondary.Value = false;
inventory.Melee.Value = false;
inventory.Explosive.Value = false;
inventory.Build.Value = false;
inventory.BuildInfinity.Value = false;

// Параметр, голосования:
function OnVoteResult(v) {
	if (v.Result === null) return;
	NewGame.RestartGame(v.Result);
}
NewGameVote.OnResult.Add(OnVoteResult); // Вынесено из функции, которая выполняется, только - на сервере, чтобы не зависало, если не отработает, также чтобы не давало баг, если вызван метод 2 раза  - и появилось 2 подписки.

function start_vote() {
	NewGameVote.Start({
		Variants: [{ MapId: 0 }],
		Timer: SetVoteTime
	}, MapRotation ? 3 : 0);
}
	
// Стандартная - команда:
Teams.Add("Blue", "<b><size=30><color=#0d177c>ß</color><color=#03088c>l</color><color=#0607b0>ᴜ</color><color=#1621ae>E</color></size></b>", new Color(0, 0, 1, 0));
var BlueTeam = Teams.Get("Blue");
BlueTeam.Spawns.SpawnPointsGroups.Add(1);
BlueTeam.Spawns.RespawnTime.Value = 5;

// Вывод, подсказки:
Ui.GetContext().Hint.Value = "!Пройдите паркур, до конца!";

// Настройки, игровых - переключателей:
stateProp.OnValue.Add(OnState);
function OnState() {
	switch (stateProp.Value) {
		case GameStateValue:
			Spawns.GetContext().Enable = true;
			break;
		case EndOfMatchStateValue:
			// После входа в конец зону, то деспавним игрока:  
                        stateProp.Value = EndOfMatchStateValue;
			
			Spawns.GetContext().Enable = false;
		        Spawns.GetContext().Despawn();
	                
			Game.GameOver(LeaderBoard.GetPlayers());
			mainTimer.Restart(EndOfMatchTime);
			// Говорим, кто выиграл - раунд:
			break;
	}
}

// Визулятор - конец, зоны:
if (GameMode.Parameters.GetBool(ViewEndParameterName)) {
	var endView = AreaViewService.GetContext().Get("EndView");
	endView.Color = new Color(0, 0, 1, 0);
	endView.Tags = [EndAreaTag];
	endView.Enable = true;
}

// Визуляторы, промежуточных - чикпоинтов:
if (GameMode.Parameters.GetBool(ViewSpawnsParameterName)) {
	var spawnsView = AreaViewService.GetContext().Get("SpawnsView");
	spawnsView.Color = new Color(1, 1, 1, 1);
	spawnsView.Tags = [SpawnAreasTag];
	spawnsView.Enable = true;
}

// Триггер, конца - раунда:
var endTrigger = AreaPlayerTriggerService.Get("EndTrigger");
endTrigger.Tags = [EndAreaTag];
endTrigger.Enable = true;
endTrigger.OnEnter.Add(function (player) {
	endTrigger.Enable = false;
	player.Properties.Get(LeaderBoardProp).Value += 1000000;
	stateProp.Value = EndOfMatchStateValue;
});

// Триггер, спавна:
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
