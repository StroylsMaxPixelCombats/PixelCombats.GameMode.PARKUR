// Импорты:
import * as Basic from 'pixel_combats/basic';
import * as Room from 'pixel_combats/room';

// Константы, таймера:
const End0fMatchTime = 11;
const GameModeTime = 381;
const VoteTime = 16;
// Константы:
const EndOfMatchStateValue = 'EndOfMatch';
const GameModeStateValue = 'Game';
const EndTriggerPoints = 10000; // Сколько даётся очков, за завершение - прохождения.
const MaxSpawnsByArea = 25; // Максимальные спавны, на - зону.
const LeaderBoardProp = 'Leader'; // Свойство, для - лидерБорда.
const CurSpawnPropName = 'CurSpawn'; // Ствойство, индекса - 0 дефолтный, индекс.
const ViewEndParameterName = 'ViewEnd'; // Название, визулизатор - конца паркура.
const ViewSpawnsParameterName = 'ViewSpawns'; // Название, визулизатра - промежуточных спавнов.
const EndAreaTag = 'EndAreaTag'; // Тег зоны, конца - паркура.
const SpawnAreasTag = 'SpawnAreasTag'; // Тег зоны, промежуточного - сохранения.
// Переменные:
let MainTimer = Room.Timers.GetContext().Get('Main');
let StateProp = Room.Properties.GetContext().Get('State');
let EndAreas = Room.AreaService.GetByTag('EndAreasTag');
let SpawnAreas = Room.AreaService.GetByTag('SpawnAreasTag');
let Inventory = Room.Inventory.GetContext();

// Свойства, параметр - режима:
const MapRotation = Room.GameMode.Parameters.GetBool('MapRotation');
Room.Map.Rotation = MapRotation;
Room.Damage.GetContext().FriendlyFire.Value = false;
Room.Damage.GetContext().DamageOut.Value = false;
Room.BreackGraph.WeakBlocks = true;

// Создание, команды:
Room.Teams.Add('Blue', '<b><size=30><color=#0d177c>ß</color><color=#03088c>l</color><color=#0607b0>ᴜ</color><color=#1621ae>E</color></size></b>', new Basic.Color(0, 0, 1, 0));
let BlueTeam = Room.Teams.Get('BlueTeam');
BlueTeam.Spawns.SpawnPointsGroups.Add(1);
Room.Ui.GetContext().Hint.Value = '!Пройдите, паркур - первым!';
Room.Ui.GetContext().MainTimerId.Value = MainTimer.Id;

// Конфигурация, инвентаря:
Inventory.Main.Value = false;
Inventory.Secondary.Value = false;
Inventory.Melee.Value = false;
Inventory.Explosive.Value = false;
Inventory.Build.Value = false;

// Настройка, голосования - после, завершения - паркура:
function OnVoteResult(Value) {
 if (Value.Result === null) return;
Room.NewGame.RestartGame(Value.Result);
}
Room.NewGameVote.OnResult.Add(OnVoteResult);  // Баг, на - 2 подписки.

function StartVote() {
 Room.NewGameVote.Start({
Variants: [{ MapId: 0 }],
Time: VoteTime
        }, MapRotation ? 3 : 0);
}

// Переключатели, игровых - режимов:
StateProp.OnValue.Add(OnState);
function OnState() {
 switch (StateProp.Value) {
case GameModeStateValue:
 Room.Spawns.GetContext().Enable = true;
 break;
case EndOfMatchStateValue:
 Room.Spawns.GetContext().Enable = false;
 Room.Spawns.GetContext().Despawn();
 Room.Game.GameOver(Room.LeaderBoard.GetPlayers());

  MainTimer.Restart(EndOfMatchTime);
// Говорим, кто - победил:
 break;
                          }
         }

// Зона, конца - паркура:
CreateNewArea('EndAreaTag', ['EndAreasTag'], true, function(p, a) {
 EndTrigger.Enable = false;
p.Properties.Get('LeaderBoardProp').Value += EndTriggerPoints;
  StateProp.Value = End0fMatchStateValue;
}, function(p, a) {}, 'ViewEnd', new Basic.Color(0, 0, 1, 0));
// Визулизатор, конца - паркура, с зоной - для цвета:
if (Room.GameMode.Parameters.GetBool('ViewEndParameterName')) {
CreateNewArea('EndAreaTag', ['EndAreasTag'], true, function(p, a) {
p.Properties.Get('Scores').Value += EndTriggerPoints;
  StateProp.Value = End0fMatchStateValue;
 }, function(p, a) {}, 'ViewEnd', new Basic.Color(0, 0, 1, 0), true);
}

// Зона, промежуточных - спавнов/сохранений: 
CreateNewArea('SpawnAreasTag', ['SpawnAreasTag'], true, function(p, a) {
if (SpawnAreas == null || SpawnAreas.length == 0) InitializeMap(); // Todo костыль, баг остался.
if (SpawnAreas == null || SpawnAreas.length == 0) return;
const CurSpawn = p.Properties.Get(CurSpawnPropName);
const LeaderBoardProp = p.Properties.Get(LeaderBoardProp);
let I = 0;
  if (CurSpawn.Value != null) I = CurSpawn.Value;
	for (; I < SpawnAreas.length; ++I) {
	   if (SpawnAreas[I] == a) {
		if (CurSpawn.Value == null || I > CurSpawn.Value) {
		CurSpawn.Value = I;
	LeaderBoardProp.Value += 10;
     } 
  break;
  }, }, }, function(p, a) {}, 'ViewSpawns', new Basic.Color(1, 1, 1, 0));
 // Визуализатор, промежуточных - спавнов:
CreateNewArea('SpawnAreasTag', ['SpawnAreasTag'], true, function(p, a) {
if (SpawnAreas == null || SpawnAreas.length == 0) InitializeMap(); // Todo костыль, баг остался.
if (SpawnAreas == null || SpawnAreas.length == 0) return;
const CurSpawn = p.Properties.Get(CurSpawnPropName);
const LeaderBoardProp = p.Properties.Get(LeaderBoardProp);
let I = 0;
  if (CurSpawn.Value != null) I = CurSpawn.Value;
	for (; I < SpawnAreas.length; ++I) {
	   if (SpawnAreas[I] == a) {
		if (CurSpawn.Value == null || I > CurSpawn.Value) {
		CurSpawn.Value = I;
	LeaderBoardProp.Value += 10;
     } 
  break;
  }, }, }, function(p, a) {}, 'ViewSpawns', new Basic.Color(1, 1, 1, 0), true);
  
// Настройка таймера, конца - игры:
 MainTimer.OnTimer.Add(function() { StartVote(); });

// ЛидерБорды:
Room.LeaderBoard.PlayerLeaderBoardValues = [
  new Basic.DisplayValueHeader('Deaths', '<b><size=30><color=#be5f1b>D</color><color=#b85519>e</color><color=#b24b17>a</color><color=#ac4115>t</color><color=#a63713>h</color><color=#a02d11>s</color></size></b>', '<b><size=30><color=#be5f1b>D</color><color=#b85519>e</color><color=#b24b17>a</color><color=#ac4115>t</color><color=#a63713>h</color><color=#a02d11>s</color></size></b>'),
  new Basic.DisplayValueHeader('Spawns', '<b><size=30><color=#be5f1b>S</color><color=#b85519>p</color><color=#b24b17>a</color><color=#ac4115>w</color><color=#a63713>n</color><color=#a02d11>s</color></size></b>', '<b><size=30><color=#be5f1b>S</color><color=#b85519>p</color><color=#b24b17>a</color><color=#ac4115>w</color><color=#a63713>n</color><color=#a02d11>s</color></size></b>'),
  new Basic.DisplayValueHeader('LeaderBoardProp', '<b><size=30><color=#be5f1b>S</color><color=#b85519>c</color><color=#b24b17>o</color><color=#ac4115>r</color><color=#a63713>e</color><color=#a02d11>s</color></size></b>', '<b><size=30><color=#be5f1b>S</color><color=#b85519>c</color><color=#b24b17>o</color><color=#ac4115>r</color><color=#a63713>e</color><color=#a02d11>s</color></size></b>'),
];

// 










