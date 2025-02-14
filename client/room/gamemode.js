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
const EndAreaTag = 'EndAreasTag'; // Тег зоны, конца - паркура.
const SpawnAreaTag = 'SpawnAreasTag'; // Тег зоны, промежуточного - сохранения.
// Переменные:
let MainTimer = Room.Timers.GetContext().Get('Main');
let StateProp = Room.Properties.GetContext().Get('State');
let EndAreas = Room.AreaService.GetByTag('EndAreasTag');
let SpawnAreas = Room.AreaService.GetByTag('SpawnAreasTag');
let Inventory = Room.Inventory.GetContext();
let EndAreaColor = new Basic.Color(0, 0, 1, 0);
let SpawnAreasColor = new Basic.Color(1, 1, 1, 0);

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
CreateNewArea('EndAreasTag', ['EndAreasTag'], true, function(p, a) {
 





