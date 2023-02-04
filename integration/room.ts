import { EventEmitter } from "events";
import {
    AnswersArray,
    ExcludeSubType,
    PlayerPointsForCategory,
    timeToMs,
    varDump,
} from "./utils";
import { Gamemode, GameModeList } from "./gamemode";
import {
    EventTimerOptions,
    EventType,
    GatherDataEvent,
    HostChangeEvent,
    LetterDrawnUpdate,
    LockEvent,
    RoomEventData,
    RoundEndUpdate,
    TimerEvent,
    TimerType,
    UpdateDataType,
    UpdateEvent,
} from "./roomevents";

import { GameStateData, RoomState } from "./utils";
import { inspect } from "util";

export class Room {
    private static _ID = 0;
    // #region room settings
    gamemode: Gamemode;
    maxNumberOfPlayers: number = 4;
    // #endregion

    // #region room state
    id: number = Room._ID + 1;
    locked: boolean = true;
    connected: string[] = [];
    playingPlayers: string[] = [];
    host: string = "";
    state: RoomState = RoomState.WAITING;
    gameSpecificData: GameStateData = {};

    // #region timer
    timerState: EventTimerOptions | null = null;
    timer: NodeJS.Timer | null = null;
    // #endregion timer

    // #endregion

    // #region player data
    playersEmitters: Map<string, EventEmitter> = new Map();
    playersAnswers: Map<string, AnswersArray> = new Map();
    playersPoints: Map<string, PlayerPointsForCategory[]> = new Map();
    // #endregion

    constructor(gamemodeID: number = -1) {
        this.gamemode =
            GameModeList.find((g) => g.id == gamemodeID) || GameModeList[0];
        Room._ID++;
    }

    // #region game functions
    calculatePoints() {
        console.log("Calculating player points!");
        for (const { id: catId } of this.gamemode.categories) {
            console.log("gathreing answers for category", catId);
            const answers: [string, number][] = [];
            for (const playerid of this.playingPlayers) {
                const answer = this.getPlayerAnswerForCategory(playerid, catId);
                if (answer) {
                    const alreadyAnswered = answers.find(
                        (f) => f[0] === answer
                    );
                    if (alreadyAnswered) {
                        alreadyAnswered[1]++;
                    } else {
                        answers.push([answer, 0]);
                    }
                }
            }
            console.log(answers);
            answers.forEach((ans) => {
                // TODO: Check if answer is correct
                const [answer, repeats] = ans;
                const pointsForAnswer =
                    this.gamemode.pointsForRepeats[
                        Math.min(
                            this.gamemode.pointsForRepeats.length - 1,
                            repeats
                        )
                    ];
                this.setPointsForEveryPlayerWhoAnswered(
                    catId,
                    answer,
                    pointsForAnswer
                );
            });
        }
    }
    setPlayerData(id: string, answers: AnswersArray) {
        console.log("Setting player data", id, answers);
        this.playersAnswers.set(id, answers);
        if (this.checkIfEveryoneAnswered()) {
            this.calculatePoints();
            this.endRound();
        }
    }
    startRound() {
        this.state = RoomState.PLAY;
        this.playingPlayers = this.connected;
        this.startTimer(TimerType.DRAW_LETTER);
    }
    doHaste() {
        this.startTimer(TimerType.HASTE_GUESSING);
    }
    endRound() {
        this.playingPlayers = [];
        this.state = RoomState.WAITING;
        this.emitEvent({
            type: EventType.UPDATE,
            playerSending: "server",
            payload: {
                type: UpdateDataType.ROUND_END,
                endRoundData: {
                    points: [...this.playersPoints],
                    answers: [...this.playersAnswers]
                },
            } as RoundEndUpdate,
        } as UpdateEvent);
    }
    connectPlayer(id: string) {
        if (this.connected.length < this.maxNumberOfPlayers) {
            this.connected.push(id);
            this.connected = [...new Set(this.connected)];
            if (!this.host) {
                this.host = id;
                this.emitEvent({
                    type: "hostchange",
                    payload: id,
                    playerSending: "server",
                } as HostChangeEvent);
            }
        }
    }
    disconnectPlayer(id: string) {
        if (this.connected.includes(id)) {
            this.connected = this.connected.filter((p) => p !== id);
            this.playersEmitters = new Map(
                [...this.playersEmitters].filter((f) => f[0] !== id)
            );
            this.host = this.connected[0];
            if (this.connected.length <= 0) {
                this.host = "";
            }
            this.emitEvent({
                type: "hostchange",
                playerSending: "server",
                payload: this.host,
            } as HostChangeEvent);
        }
    }
    // #endregion game functions

    // #region utils / wrappers
    setPointsForEveryPlayerWhoAnswered(
        catId: number,
        ans: string,
        pts: number
    ) {
        for (const playerid of this.playingPlayers) {
            const answers = this.getPlayerAnswers(playerid);
            if (!answers) continue;
            const answerForCategory = answers.find(
                (answer) => answer[0] === catId
            )?.[1];
            if (!answerForCategory) continue;
            if (answerForCategory === ans)
                this.setPointsOfPlayerForCategory(playerid, catId, pts);
        }
    }
    setPointsOfPlayerForCategory(id: string, catId: number, pts: number) {
        const playerPoints = this.getPlayerPoints(id);
        if (playerPoints) {
            const categoryPoints = playerPoints.find(
                (p) => p.categoryId === catId
            );
            if (categoryPoints) {
                categoryPoints.points = pts;
            } else {
                playerPoints.push({ categoryId: catId, points: pts });
            }
        } else {
            this.playersPoints.set(id, [{ categoryId: catId, points: pts }]);
        }
    }
    getPlayerAnswerForCategory(id: string, catId: number) {
        return this.playersAnswers.get(id)?.find((an) => an[0] === catId)?.[1];
    }
    getPlayerAnswers(id: string) {
        return this.playersAnswers.get(id);
    }
    getPlayerPoints(id: string) {
        return this.playersPoints.get(id);
    }
    getPlayersAnswers(ids: string[]) {
        return ids.map((id) => this.getPlayerAnswers(id));
    }
    getPlayersPoints(ids: string[]) {
        return ids.map((id) => this.getPlayerPoints(id));
    }
    emitEvent(data: RoomEventData) {
        console.log("Emmitting event to all players", data);
        if (data.type === "leave") {
            this.disconnectPlayer(data.playerSending);
        } else if (data.type === "join") {
            this.connectPlayer(data.playerSending);
        }
        [...this.playersEmitters].forEach((e) => e[1].emit("SSE", data));
    }
    createPlayerEmitter(id: string) {
        this.playersEmitters.set(id, new EventEmitter());
    }
    lockAnswers(lock: boolean) {
        this.locked = lock;
        this.emitEvent({
            type: EventType.TOGGLELOCK,
            payload: lock,
            playerSending: "server",
        } as LockEvent);
    }
    stopTimer() {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.timerState = null;
        this.emitEvent({
            type: EventType.TIMER,
            payload: null,
            playerSending: "server",
        });
    }
    startTimer(type: TimerType, instaHaste: boolean = false) {
        switch (type) {
            case TimerType.DRAW_LETTER:
                this.timerOnStart(
                    true,
                    new Date().getTime() +
                        (this.gamemode.drawlettertime || timeToMs(0, 2)),
                    type
                );
                if (this.timer) clearInterval(this.timer);
                this.timer = setInterval(() => {
                    if (!this.timerState) return this.stopTimer();
                    if (this.timerState.endTime < new Date().getTime())
                        this.drawLetterTimerOnEnd();
                }, 200);
                break;
            case TimerType.PRIMARY_GUESSING:
                const regulationEndTime =
                    new Date().getTime() + this.gamemode.gametime;
                this.timerOnStart(false, regulationEndTime, type);
                if (this.gameSpecificData)
                    this.gameSpecificData.regulationEndTime = regulationEndTime;
                if (this.timer) clearInterval(this.timer);
                this.timer = setInterval(() => {
                    if (!this.timerState) return this.stopTimer();
                    if (this.timerState.endTime < new Date().getTime())
                        this.primaryGuessingTimerOnEnd();
                }, 200);
                break;
            case TimerType.HASTE_GUESSING:
                let endTime = new Date().getTime();
                if (!instaHaste) {
                    if (this.gamemode.hastetime)
                        endTime += this.gamemode.hastetime;
                    else {
                        if (this.gameSpecificData.regulationEndTime)
                            endTime = this.gameSpecificData.regulationEndTime;
                        else return;
                    }
                }
                this.timerOnStart(false, endTime, type);
                if (this.timer) clearInterval(this.timer);
                this.timer = setInterval(() => {
                    if (!this.timerState) return this.stopTimer();
                    if (this.timerState.endTime < new Date().getTime())
                        this.hasteGuessingTimerOnEnd();
                }, 200);
        }
    }
    // #endregion utils / wrapper

    // #region timer functions
    timerOnStart(locked: boolean, endTime: number, type: TimerType) {
        this.timerState = {
            endTime,
            timerType: type,
        };
        this.playersAnswers = new Map();
        this.lockAnswers(locked);
        this.emitEvent({
            type: EventType.TIMER,
            playerSending: "server",
            payload: this.timerState,
        } as TimerEvent);
    }
    drawLetterTimerOnEnd() {
        const randomLetter =
            this.gamemode.startingLetters[
                Math.floor(
                    Math.random() * (this.gamemode.startingLetters.length - 1)
                )
            ];
        this.gameSpecificData = {
            startingLetter: randomLetter,
            regulationEndTime: 0,
        };
        console.log(
            "Randomly generated letter: ",
            randomLetter,
            "from",
            this.gamemode.startingLetters
        );
        this.emitEvent({
            type: EventType.UPDATE,
            playerSending: "server",
            payload: {
                type: UpdateDataType.LETTER_DRAWN,
                letter: this.gameSpecificData.startingLetter,
                regulationEndTime: 0,
            } as LetterDrawnUpdate,
        } as UpdateEvent);
        this.stopTimer();
        this.startTimer(TimerType.PRIMARY_GUESSING);
    }
    primaryGuessingTimerOnEnd() {
        this.stopTimer();
        this.startTimer(TimerType.HASTE_GUESSING, true);
    }
    hasteGuessingTimerOnEnd() {
        this.emitEvent({
            type: EventType.GATHER_DATA,
            payload: "abc",
            playerSending: "server",
        } as GatherDataEvent);
        this.gameSpecificData = {};
        this.lockAnswers(true);
        this.stopTimer();
    }
    // #endregion timer functions

    // #region status checks
    checkIfEveryoneAnswered() {
        for (const player of this.playingPlayers) {
            if (!this.playersAnswers.get(player)) return false;
        }
        return true;
    }
    // #endregion status checks
}
