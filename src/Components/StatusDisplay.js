import React from 'react';
import {Clickable, Help, ProgressBar, StaticFn} from "./Common";
import {ResourceType} from "../Game/Common";
import {controller} from "../Controller/Controller";
import {localize} from "./Localization";
import {getCurrentThemeColors} from "./ColorTheme";
import {TraitName, Traits} from '../Game/Traits';

// color, value
function ResourceStack(props) {
	let colors = getCurrentThemeColors();
	return <div style={{
		top: 1,
		marginRight: 8,
		position: "relative",
		width: 16,
		height: 16,
		borderRadius: 8,
		display: "inline-block",
		border: "1px solid " + colors.bgHighContrast,
		verticalAlign: "top"
	}}>
		<div hidden={!props.value} style={{
			backgroundColor: `${props.color}`,
			position: "absolute",
			top: 2,
			bottom: 2,
			left: 2,
			right: 2,
			borderRadius: "inherit"
		}}/>
	</div>;
}

// name, color, value, progress, width, className
function ResourceBar(props = {
	name: "placeholder",
	color: "#6cf",
	value: "0.34/1.00",
	progress: 0.34,
	width: 100,
	hidden: false
}) {
	return <div className={props.className} hidden={props.hidden} style={{marginBottom: 4, lineHeight: "1.5em"}}>
		<div style={{display: "inline-block", height: "100%", width: 108}}>{props.name}</div>
		<div style={{width: 200, display: "inline-block"}}>
			<ProgressBar backgroundColor={props.color}
						 progress={props.progress}
						 width={props.width}
						 offsetY={4}/>
			<div style={{marginLeft: 6, height: "100%", display: "inline-block"}}>{props.value}</div>
		</div>
	</div>;
}

// name, color, currentStacks, maxStacks
function ResourceCounter(props) {
	let stacks = [];
	for (let i = 0; i < props.maxStacks; i++) {
		stacks.push(<ResourceStack key={i} color={props.color} value={i < props.currentStacks}/>)
	}
	return <div className={props.className} style={{marginBottom: 4, lineHeight: "1.5em"}}>
		<div style={{display: "inline-block", height: "100%", width: 108}}>{props.name}</div>
		<div style={{width: 200, display: "inline-block"}}>
			<div style={{display: "inline-block", marginLeft: 6}}>{stacks}</div>
			<div style={{marginLeft: 6, height: "100%", display: "inline-block"}}>{props.currentStacks + "/" + props.maxStacks}</div>
		</div>
	</div>;
}

// copy of ResourceCounter specialized for the paint gauge
// name, holyColor, cometColor, currentStacks, maxStacks, hasComet
function PaintGaugeCounter(props) {
	let stacks = [];
	for (let i = 0; i < 5; i++) {
		// dip the last one in black paint
		let isComet = props.hasComet && i === props.currentStacks - 1;
		stacks.push(<ResourceStack key={i} color={isComet ? props.cometColor : props.holyColor} value={i < props.currentStacks}/>)
	}
	return <div className={props.className} style={{marginBottom: 4, lineHeight: "1.5em"}}>
		<div style={{display: "inline-block", height: "100%", width: 108}}>{props.name}</div>
		<div style={{width: 200, display: "inline-block"}}>
			<div style={{display: "inline-block", marginLeft: 6}}>{stacks}</div>
			<div style={{marginLeft: 6, height: "100%", display: "inline-block"}}>{props.currentStacks + "/" + props.maxStacks}</div>
		</div>
	</div>;
}

function ResourceText(props) {
	return <div className={props.className} style={{marginBottom: 4, lineHeight: "1.5em"}}>
		<div style={{display: "inline-block", height: "100%", width: 108}}>{props.name}</div>
		<div style={{width: 200, display: "inline-block"}}>
			<div style={{display: "inline-block", marginLeft: 6}}>{props.text}</div>
		</div>
	</div>;
}

const buffIcons = new Map();

const pctBuffResources = [
	ResourceType.Aetherhues,
	ResourceType.Aetherhues + "2",
	ResourceType.MonochromeTones,
	ResourceType.HammerTime,
	ResourceType.HammerTime + "2",
	ResourceType.HammerTime + "3",
	ResourceType.Inspiration,
	ResourceType.SubtractivePalette,
	ResourceType.SubtractivePalette + "2",
	ResourceType.SubtractivePalette + "3",
	ResourceType.SubtractiveSpectrum,
	ResourceType.Hyperphantasia,
	ResourceType.Hyperphantasia + "2",
	ResourceType.Hyperphantasia + "3",
	ResourceType.Hyperphantasia + "4",
	ResourceType.Hyperphantasia + "5",
	ResourceType.RainbowBright,
	ResourceType.Starstruck,
	ResourceType.StarryMuse,
	ResourceType.TemperaGrassa,
	ResourceType.Smudge,
];

const casterRoleBuffResources = [
	ResourceType.Addle,
	ResourceType.Swiftcast,
	ResourceType.LucidDreaming,
	ResourceType.Surecast,
	ResourceType.Tincture,
];


pctBuffResources.forEach(
	(buff) => buffIcons.set(buff, require(`./Asset/Buffs/PCT/${buff}.png`))
);

casterRoleBuffResources.forEach(
	(buff) => buffIcons.set(buff, require(`./Asset/Buffs/CasterRole/${buff}.png`))
);

buffIcons.set(ResourceType.Sprint, require("./Asset/Buffs/General/Sprint.png"));

// rscType, stacks, timeRemaining, onSelf, enabled
function Buff(props) {
	let assetName = props.rscType;
	if ([
			ResourceType.Aetherhues,
			ResourceType.SubtractivePalette,
			ResourceType.HammerTime,
			ResourceType.Hyperphantasia
		].includes(props.rscType)) {
		if (props.stacks > 1) assetName += props.stacks.toFixed(0);
	}
	return <div title={props.rscType} className={props.className + " buff " + props.rscType}>
		<Clickable content={
			<img style={{height: 40}} src={buffIcons.get(assetName)} alt={props.rscType}/>
		} style={{
			display: "inline-block",
			verticalAlign: "top",
			filter: props.enabled ? "none" : "grayScale(100%)"
		}} onClickFn={()=>{
			if (props.onSelf) {
				controller.requestToggleBuff(props.rscType);
				controller.updateStatusDisplay(controller.game);
				controller.updateSkillButtons(controller.game);
				controller.autoSave();
			}
		}}/>
		{/* When the buff has no timer, we still want it to align with other buffs, so just pad some empty space */}
		<span className={"buff-label"} style={{visibility: props.timeRemaining === undefined ? "hidden" : ""}}>
			{props.timeRemaining ? props.timeRemaining : "0.000"}
		</span>
	</div>
}

function BuffsDisplay(props) {
	let data = (props && props.data) ? props.data : {
		leyLinesEnabled: true,
		leyLinesCountdown: 0,
		sharpcastCountdown: 0,
		triplecastCountdown: 0,
		triplecastStacks: 0,
		firestarterCountdown: 0,
		thunderheadCountdown: 0,
		manawardCountdown: 0,
		swiftcastCountdown: 0,
		lucidDreamingCountdown: 0,
		surecastCountdown: 0,
		tinctureCountdown: 0,
		sprintCountdown: 0,

		aetherhuesCountdown: 0,
		aetherhuesStacks: 0,
		monochromeTones: 0,
		subtractivePalette: 0,
		subtractiveSpectrumCountdown: 0,
		starryMuseCountdown: 0,
		hyperphantasiaCountdown: 0,
		hyperphantasiaStacks: 0,
		inspirationEnabled: true,
		inspirationCountdown: 0,
		rainbowBrightCountdown: 0,
		starstruckCountdown: 0,
		hammerTimeCountdown: 0,
		hammerTimeStacks: 0,
		temperaCoatCountdown: 0,
		temperaGrassaCountdown: 0,
		smudgeCountdown: 0,
	};
	let buffs = [];
	buffs.push({
		rscType: ResourceType.LeyLines,
		onSelf: true,
		enabled: data.leyLinesEnabled,
		stacks:1,
		timeRemaining: data.leyLinesCountdown.toFixed(3),
		className: data.leyLinesCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Triplecast,
		onSelf: true,
		enabled: true,
		stacks: data.triplecastStacks,
		timeRemaining: data.triplecastCountdown.toFixed(3),
		className: data.triplecastCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Firestarter,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.firestarterCountdown.toFixed(3),
		className: data.firestarterCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Thunderhead,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.thunderheadCountdown.toFixed(3),
		className: data.thunderheadCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Manaward,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.manawardCountdown.toFixed(3),
		className: data.manawardCountdown > 0 ? "" : "hidden"
	});

	let pushPictoTimer = function(rscType, stacks, cd) {
		let enabled = (rscType === ResourceType.Inspiration) ? data.inspirationEnabled : true;
		buffs.push({
			rscType: rscType,
			onSelf: true,
			enabled: enabled,
			stacks: stacks,
			timeRemaining: cd.toFixed(3),
			className: cd > 0 ? "" : "hidden"
		});
	};

	let pushPictoIndefinite = function(rscType, stacks) {
		buffs.push({
			rscType: rscType,
			onSelf: true,
			enabled: true,
			stacks: stacks,
			className: stacks ? "" : "hidden",
		});
	};

	// TODO check order
	pushPictoTimer(ResourceType.RainbowBright, 1, data.rainbowBrightCountdown);
	pushPictoTimer(ResourceType.Hyperphantasia, data.hyperphantasiaStacks, data.hyperphantasiaCountdown);
	pushPictoTimer(ResourceType.Inspiration, 1, data.inspirationCountdown);
	pushPictoTimer(ResourceType.SubtractiveSpectrum, 1, data.subtractiveSpectrumCountdown);
	pushPictoTimer(ResourceType.HammerTime, data.hammerTimeStacks, data.hammerTimeCountdown);
	pushPictoTimer(ResourceType.Starstruck, 1, data.starstruckCountdown);
	pushPictoTimer(ResourceType.Aetherhues, data.aetherhuesStacks, data.aetherhuesCountdown);
	pushPictoIndefinite(ResourceType.MonochromeTones, data.monochromeTones);
	pushPictoIndefinite(ResourceType.SubtractivePalette, data.subtractivePalette);
	pushPictoTimer(ResourceType.StarryMuse, 1, data.starryMuseCountdown);
	pushPictoTimer(ResourceType.TemperaCoat, 1, data.temperaCoatCountdown);
	pushPictoTimer(ResourceType.TemperaGrassa, 1, data.temperaGrassaCountdown);
	pushPictoTimer(ResourceType.Smudge, 1, data.smudgeCountdown);

	buffs.push({
		rscType: ResourceType.Swiftcast,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.swiftcastCountdown.toFixed(3),
		className: data.swiftcastCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.LucidDreaming,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.lucidDreamingCountdown.toFixed(3),
		className: data.lucidDreamingCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Surecast,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.surecastCountdown.toFixed(3),
		className: data.surecastCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Tincture,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.tinctureCountdown.toFixed(3),
		className: data.tinctureCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Sprint,
		onSelf: true,
		enabled: true,
		stacks:1,
		timeRemaining: data.sprintCountdown.toFixed(3),
		className: data.sprintCountdown > 0 ? "" : "hidden"
	});

	for (let i = 0; i < buffs.length; i++) buffs[i].key=i;
	return <div className={"buffsDisplay self"}>
		{buffs.map(obj=>{return <Buff {...obj}/>;})}
	</div>
}

function EnemyBuffsDisplay(props)
{
	let data = (props && props.data) ? props.data : {
		DoTCountdown: 0,
		addleCountdown: 0
	};
	let buffs = [];
	buffs.push({
		rscType: ResourceType.ThunderDoT,
		enabled: true,
		stacks:1,
		timeRemaining: data.DoTCountdown.toFixed(3),
		className: data.DoTCountdown > 0 ? "" : "hidden"
	});
	buffs.push({
		rscType: ResourceType.Addle,
		enabled: true,
		stacks:1,
		timeRemaining: data.addleCountdown.toFixed(3),
		className: data.addleCountdown > 0 ? "" : "hidden"
	});

	for (let i = 0; i < buffs.length; i++) buffs[i].key=i;
	return <div className={"buffsDisplay enemy"}>
		{buffs.map(obj=>{return <Buff {...obj}/>;})}
	</div>
}

function ResourceLocksDisplay(props) {
	let colors = getCurrentThemeColors();
	let data = (props && props.data) ? props.data : {
		gcdReady: true,
		gcd: 2.5,
		timeTillGCDReady: 0,
		castLocked: false,
		castLockTotalDuration: 0,
		castLockCountdown: 0,
		animLocked: false,
		animLockTotalDuration: 0,
		animLockCountdown: 0,
		canMove: true
	};
	let gcd = <ResourceBar
		name={"GCD"}
		color={colors.resources.gcdBar}
		progress={data.gcdReady ? 0 : 1 - data.timeTillGCDReady / data.gcd}
		value={data.timeTillGCDReady.toFixed(3)}
		width={100}
		hidden={data.gcdReady}/>;
	let tax = <ResourceBar
		name={"casting/taxed"}
		color={data.canMove ? colors.resources.gcdBar : colors.resources.lockBar}
		progress={data.castLocked ? 1 - data.castLockCountdown / data.castLockTotalDuration : 0}
		value={data.castLockCountdown.toFixed(3)}
		width={100}
		hidden={!data.castLocked}/>;
	let anim = <ResourceBar
		name={"using skill"}
		color={colors.resources.lockBar}
		progress={data.animLocked ? 1 - data.animLockCountdown / data.animLockTotalDuration : 0}
		value={data.animLockCountdown.toFixed(3)}
		width={100}
		hidden={!data.animLocked}/>;
	return <div style={{position: "absolute"}}>
		{gcd}
		{tax}
		{anim}
	</div>
}

function ResourcesDisplay(props) {
	let colors = getCurrentThemeColors();
	let data = (props && props.data) ? props.data : undefined;
	let resources = (data && data.resources) ?? {
		mana: 10000,
		timeTillNextManaTick: 0.8,
		enochianCountdown: 0,
		astralFire: 0,
		umbralIce: 0,
		umbralHearts: 0,
		paradox: 0,
		astralSoul: 0,
		polyglotCountdown: 30,
		polyglotStacks: 0,

		portrait: 0,
		depictions: 0,
		creatureCanvas: 0,
		weaponCanvas: 0,
		landscapeCanvas: 0,
		paletteGauge: 0,
		paint: 0,
		hasComet: 0,
	}

	let manaBar = <ResourceBar
		name={"MP"}
		color={colors.resources.mana}
		progress={resources.mana / 10000}
		value={Math.floor(resources.mana) + "/10000"}
		width={100}/>;
	let manaTick = <ResourceBar
		name={localize({
			en: "MP tick",
			zh: "跳蓝时间",
			ja: "MPティック"
		})}
		color={colors.resources.manaTick}
		progress={1 - resources.timeTillNextManaTick / 3}
		value={(3 - resources.timeTillNextManaTick).toFixed(3) + "/3"}
		width={100}/>;
	let enochian = <ResourceBar
		name={localize({
			en: "enochian",
			zh: "天语",
			ja: "エノキアン"
		})}
		color={colors.resources.enochian}
		progress={resources.enochianCountdown / 15}
		value={`${resources.enochianCountdown.toFixed(3)}`}
		width={100}/>;
	let afui = <ResourceCounter
		name={localize({
			en: "AF/UI",
			zh: "冰火层数",
			ja: "AF/UB"
		})}
		color={resources.astralFire > 0 ? colors.resources.astralFire : colors.resources.umbralIce}
		currentStacks={resources.astralFire > 0 ? resources.astralFire : resources.umbralIce}
		maxStacks={3}/>;
	let uh = <ResourceCounter
		name={
			localize({
				en: "hearts",
				zh: "冰针",
				ja: "アンブラルハート"
			})}
		color={colors.resources.umbralHeart}
		currentStacks={resources.umbralHearts}
		maxStacks={3}/>;
	let paradox = data.level && Traits.hasUnlocked(TraitName.AspectMasteryIV, data.level) ?
		<ResourceCounter
			name={
				localize({
					en: "paradox",
					zh: "悖论",
					ja: "パラドックス"
				})}
			color={colors.resources.paradox}
			currentStacks={resources.paradox}
			maxStacks={1}/>
		: undefined;
	let soul = data.level && Traits.hasUnlocked(TraitName.EnhancedAstralFire, data.level) ?
		<ResourceCounter
			name={
				localize({
					en: "astral soul",
					zh: "星极魂",
					ja: "アストラルソウル"
				})}
			color={colors.resources.astralSoul}
			currentStacks={resources.astralSoul}
			maxStacks={6}/>
		: undefined;
	let polyTimer = <ResourceBar
		name={
			localize({
				en: "poly timer",
				zh: "通晓计时",
				ja: "エノキ継続時間"
			})}
		color={colors.resources.polyTimer}
		progress={1 - resources.polyglotCountdown / 30}
		value={`${resources.polyglotCountdown.toFixed(3)}`}
		width={100}/>;
	
	const polyglotStacks = 
		(data.level && Traits.hasUnlocked(TraitName.EnhancedPolyglotII, data.level) && 3) ||
		(data.level && Traits.hasUnlocked(TraitName.EnhancedPolyglot, data.level) && 2) ||
		1;
	let poly = <ResourceCounter
		name={
			localize({
				en: "poly stacks",
				zh: "通晓层数",
				ja: "ポリグロット"
			})}
		color={colors.resources.polyStacks}
		currentStacks={resources.polyglotStacks}
		maxStacks={polyglotStacks}/>;

	let portrait = <ResourceText
		name={
			localize({
				en: "portrait",
			})
		}
		text={resources.portrait === 0 ? "/" : (resources.portrait === 1 ? "moogle" : "madeen")}
	/>;
	let depictions = <ResourceText
		name={
			localize({
				en: "depictions",
			})
		}
		text={
			resources.depictions === 0 ? "/" :
				(resources.depictions === 1 ? "pom" :
					(resources.depictions === 2 ? "wing" :
						(resources.depictions === 3 ? "fang" : "maw")))
		}
	/>;

	let creatureCanvas = <ResourceCounter
		name={
			localize({
				en: "creature",
			})
		}
		color={colors.resources.creatureCanvas}
		currentStacks={resources.creatureCanvas}
		maxStacks={1}
	/>;

	let weaponCanvas = <ResourceCounter
		name={
			localize({
				en: "weapon",
			})
		}
		color={colors.resources.weaponCanvas}
		currentStacks={resources.weaponCanvas}
		maxStacks={1}
	/>;

	let landscapeCanvas = <ResourceCounter
		name={
			localize({
				en: "landscape",
			})
		}
		color={colors.resources.landscapeCanvas}
		currentStacks={resources.landscapeCanvas}
		maxStacks={1}
	/>;

	let paletteGauge = <ResourceBar
		name={
			localize({
				en: "palette gauge",
			})
		}
		color={colors.resources.paletteGauge}
		progress={resources.paletteGauge / 100}
		value={resources.paletteGauge.toFixed(0)}
		width={100}
	/>;

	// name, holyColor, cometColor, currentStacks, maxStacks, hasComet
	let paint = (data.level && Traits.hasUnlocked(TraitName.EnhancedArtistry, data.level)) ? <PaintGaugeCounter
		name={
			localize({
				en: "paint gauge",
			})
		}
		holyColor={colors.resources.holyPaint}
		cometColor={colors.resources.cometPaint}
		currentStacks={resources.paint}
		maxStacks={5}
		hasComet={data.level && Traits.hasUnlocked(TraitName.EnhancedPalette, data.level) && resources.hasComet}
	/> : undefined;
		
	return <div style={{textAlign: "left"}}>
		{manaBar}
		{manaTick}
		{portrait}
		{depictions}
		{creatureCanvas}
		{weaponCanvas}
		{landscapeCanvas}
		{paletteGauge}
		{paint}
	</div>;
}

export var updateStatusDisplay = (data)=>{};
export class StatusDisplay extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			time: 0,
			resources: null,
			resourceLocks: null,
			selfBuffs: null,
			enemyBuffs: null,
			level: null,
		}
		updateStatusDisplay = ((newData)=>{
			this.setState({
				time: newData.time,
				resources: newData.resources,
				resourceLocks: newData.resourceLocks,
				selfBuffs: newData.selfBuffs,
				enemyBuffs: newData.enemyBuffs,
				level: newData.level,
			});
		});
	}
	componentDidMount() {
		controller.updateStatusDisplay(controller.game);
	}
	render() {
		return <div className={"statusDisplay"}>
			<div style={{position: "absolute", top: -8, right: 0, zIndex: 1}}><Help topic={"mainControlRegion"} content={
				<div className="toolTip">

					{localize({
						en:
							<>
								<div className="paragraph"><span style={{color: "lightgray"}}>grey</span> border: not focused</div>
								<div className="paragraph"><b style={{color: "mediumpurple"}}>purple</b> border: receiving input</div>
								<div className="paragraph"><b style={{color: "mediumseagreen"}}>green</b> border: real-time</div>
								<div className="paragraph"><b style={{color: "darkorange"}}>orange</b> border: viewing historical state, not receiving input</div>
							</>,
						ja:
							<>
								<div className="paragraph"><span style={{color: "lightgray"}}>グレー</span> : 未選択</div>
								<div className="paragraph"><b style={{color: "mediumpurple"}}>紫</b> : 入力可</div>
								<div className="paragraph"><b style={{color: "mediumseagreen"}}>緑</b> : リアルタイム</div>
								<div className="paragraph"><b style={{color: "darkorange"}}>オレンジ</b> : 任意の時点の状態を確認中。入力不可</div>
							</>,
					})}
				</div>
			}/></div>
			<div className={"-left"}>
				<span style={{display: "block", marginBottom: 10}}>
					{localize({en: "time: ", zh: "战斗时间：", ja: "経過時間："})}
					{`${StaticFn.displayTime(this.state.time, 3)} (${this.state.time.toFixed(3)})`}
				</span>
				<ResourcesDisplay data={this.state}/>
			</div>
			<div className={"-right"}>
				<ResourceLocksDisplay data={this.state.resourceLocks}/>
				<EnemyBuffsDisplay data={this.state.enemyBuffs}/>
				<BuffsDisplay data={this.state.selfBuffs}/>
			</div>
		</div>
	}
}
