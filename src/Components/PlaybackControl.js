import React from 'react';
import {controller} from '../Controller/Controller'
import {ButtonIndicator, Clickable, Expandable, Help, Input} from "./Common";
import {getCachedValue, setCachedValue, ShellVersion, TickMode} from "../Controller/Common";
import {FIXED_BASE_CASTER_TAX, LevelSync, ProcMode, ResourceType} from "../Game/Common";
import {resourceInfos} from "../Game/Resources";
import {localize} from "./Localization";
import {getCurrentThemeColors} from "./ColorTheme";
import {XIVMath} from '../Game/XIVMath';

const tableStyle = `
	table {
		border-collapse: collapse;
		width: 100%;
	}
	th, td {
		text-align: center;
		padding: 0.15em;
		border: 1px solid ${getCurrentThemeColors().bgHighContrast};
		width: 33%
	}
`

export class TimeControl extends React.Component {
	constructor(props) {
		super(props);

		this.saveSettings = (settings)=>{
			let str = JSON.stringify({
				tickMode: settings.tickMode,
				timeScale: settings.timeScale
			});
			setCachedValue("playbackSettings", str);
		}

		this.loadSettings = ()=>{
			let str = getCachedValue("playbackSettings");
			if (str) {
				let settings = JSON.parse(str);
				return settings;
			}
			return undefined;
		}

		this.setTickMode = ((e)=>{
			if (!e || !e.target || isNaN(parseInt(e.target.value))) return;
			this.setState({tickMode: parseInt(e.target.value)});
			let numVal = parseInt(e.target.value);
			if (!isNaN(numVal)) {
				controller.setTimeControlSettings({
					tickMode: numVal,
					timeScale: this.state.timeScale
				});
				this.saveSettings({
					tickMode: numVal,
					timeScale: this.state.timeScale
				});
			}
		});

		this.setTimeScale = ((val)=>{
			this.setState({timeScale: val});
			let numVal = parseFloat(val);
			if (!isNaN(numVal)) {
				controller.setTimeControlSettings({
					tickMode: this.state.tickMode,
					timeScale: numVal
				});
				this.saveSettings({
					tickMode: this.state.tickMode,
					timeScale: numVal
				});
			}
		});

		let settings = this.loadSettings();
		if (settings) {
			this.state = {
				tickMode: settings.tickMode,
				timeScale: settings.timeScale
			};
		} else {
			this.state = {
				tickMode: 1,
				timeScale: 2
			};
		}
	}
	componentDidMount() {
		controller.setTimeControlSettings({tickMode: this.state.tickMode, timeScale: this.state.timeScale});
	}
	render() {
		let radioStyle = {
			position: "relative",
			top: 3,
			marginRight: "0.25em"
		};
		let tickModeOptionStyle = {
			display: "inline-block",
			marginRight: "0.5em"
		};
		return <div style={{display: "inline-block", marginBottom: 15}}>
			<div style={{marginBottom: 5}}>
				<div style={{marginBottom: 5}}><b>{localize({en: "Control", zh: "战斗时间控制"})}</b></div>
				<label style={tickModeOptionStyle}>
					<input style={radioStyle} type={"radio"} onChange={this.setTickMode}
						   value={TickMode.RealTimeAutoPause}
						   checked={this.state.tickMode===TickMode.RealTimeAutoPause}
						   name={"tick mode"}/>
					{localize({
						en: "real-time auto pause",
						zh: "实时(带自动暂停）"
					})}
				</label>
				<Help topic={"ctrl-realTimeAutoPause"} content={
					<div className="toolTip">
						{localize({
							en: <div className="paragraph">*Recommended*</div>,
							zh: <div className="paragraph">*推荐设置*</div>
						})}
						{localize({
							en: <div className="paragraph">- click to use a skill. or if it's not ready, click again to wait then retry</div>,
							zh: <div className="paragraph">- 点击图标使用技能; 战斗时间会按下方设置的倍速自动前进直到可释放下一个技能。如果点击的技能CD没有转好，再次点击会快进到它CD转好并重试。</div>
						})}
					</div>
				}/><br/>
				<label style={tickModeOptionStyle}>
					<input style={radioStyle} type={"radio"} onChange={this.setTickMode}
						   value={TickMode.Manual}
						   checked={this.state.tickMode===TickMode.Manual}
						   name={"tick mode"}/>
					{localize({
						en: "manual",
						zh: "手动"
					})}
				</label>
				<Help topic={"ctrl-manual"} content={
					<div className="toolTip">
						{localize({
							en: <div className="paragraph">- click to use a skill. or if it's not ready, click again to wait then retry</div>,
							zh: <div className="paragraph">- 点击图标使用技能; 战斗时间会自动快进至可释放下一个技能。如果点击的技能CD没有转好，再次点击可以快进到它CD转好并重试。</div>
						})}
						{localize({
							en:<div className="paragraph">- <ButtonIndicator text={"space"}/> to advance game time to the earliest possible time for the next skill</div>,
							zh: <div className="paragraph">- 点击 <ButtonIndicator text={"空格"}/> 来快进到下一个可释放技能的时间点。</div>
						})}
					</div>
				}/><br/>
			</div>
			<Input defaultValue={this.state.timeScale} description={<span>{localize({en: "time scale ", zh: "倍速 "})}<Help topic={"timeScale"} content={
				<div>{localize({
					en: "rate at which game time advances automatically (aka when in real-time)",
					zh: "战斗时间自动前进的速度"})}</div>
			}/>: </span>} onChange={this.setTimeScale}/>
		</div>
	}
}

function ConfigSummary(props) {
	let gcd = controller.gameConfig.adjustedGCD(false);
	let gcdAfterTax = controller.gameConfig.getAfterTaxGCD(gcd).toFixed(3);
	let castTimesTableDesc = localize({
		en: "Unlike GCDs that have 2 digits of precision, cast times have 3. See About this tool/Implementation notes.",
		zh: "不同于GCD那样精确到小数点后2位，咏唱时间会精确到小数点后3位。详见 关于/实现细节"
	});
	let preTaxFn = t => { return controller.gameConfig.adjustedCastTime(t, false).toFixed(3); }
	let afterTaxFn = t => {
		let preTax = controller.gameConfig.adjustedCastTime(t, false);
		return controller.gameConfig.getAfterTaxCastTime(preTax).toFixed(3);
	};
	let castTimesChart =<div>
		<style>{tableStyle}</style>
		<table>
			<tbody>
			<tr>
				<th>{localize({en: "Base", zh: "基准"})}</th>
				<th>{localize({en: "Pre-tax", zh: "税前"})}</th>
				<th>{localize({en: "After-tax", zh: "税后"})}</th>
			</tr>
			<tr>
				<td>2.5</td>
				<td>{preTaxFn(2.5)}</td>
				<td>{afterTaxFn(2.5)}</td>
			</tr>
			<tr>
				<td>2.8</td>
				<td>{preTaxFn(2.8)}</td>
				<td>{afterTaxFn(2.8)}</td>
			</tr>
			<tr>
				<td>3.0</td>
				<td>{preTaxFn(3.0)}</td>
				<td>{afterTaxFn(3.0)}</td>
			</tr>
			<tr>
				<td>3.5</td>
				<td>{preTaxFn(3.5)}</td>
				<td>{afterTaxFn(3.5)}</td>
			</tr>
			<tr>
				<td>4.0</td>
				<td>{preTaxFn(4.0)}</td>
				<td>{afterTaxFn(4.0)}</td>
			</tr>
			</tbody>
		</table>
	</div>
	let lucidTickOffset = controller.game.lucidTickOffset.toFixed(3);
	let lucidOffsetDesc = localize({
		en: "the random time offset of lucid dreaming ticks relative to mp ticks",
		zh: "醒梦buff期间，每次跳蓝后多久跳醒梦（由随机种子决定）"
	});
	let thunderTickOffset = controller.game.thunderTickOffset.toFixed(3);
	let thunderOffsetDesc = localize({
		en: "the random time offset of thunder DoT ticks relative to mp ticks",
		zh: "雷DoT期间，每次跳蓝后多久跳雷（由随机种子决定）"
	});
	let procMode = controller.gameConfig.procMode;
	let numOverrides = controller.gameConfig.initialResourceOverrides.length;
	const legacyCasterTax = controller.gameConfig.legacy_casterTax;
	let excerpt = localize({
		en: `WARNING: this record was created in an earlier version of PCT in the Shell and uses the deprecated caster tax of ${legacyCasterTax}s instead of calculating from your FPS input below. Hover for details: `,
		zh: `警告：此时间轴文件创建于一个更早版本的排轴器，因此计算读条时间时使用的是当时手动输入的读条税${legacyCasterTax}秒（现已过时），而非由下方的“帧率”和“读条时间修正”计算得来。更多信息：`
	});
	let warningColor = getCurrentThemeColors().warning;
	let blurb = localize({
		en: <div>
				<div className={"paragraph"}>
					GCD calculations now include FPS adjustment and is more precise.
				</div>
				<div className={"paragraph"} style={{color: warningColor}}>
					You are strongly encouraged to create a new record (in another timeline slot or from 'apply and reset') and migrate your fight plan.
					Support for loading legacy files might drop in the future.
				</div>
			</div>,
		zh: <div>
			<div className={"paragraph"}>
				现在所有的GCD加上自动计算的帧率税构成，模拟结果也更精确。
			</div>
			<div className={"paragraph"} style={{color: warningColor}}>
				排轴器今后的更新可能会导致无法加载过时的文件，所以强烈建议将此时间轴迁移到一个新建的存档中（添加时间轴，或者应用并重置时间轴）。
			</div>
		</div>
	});
	let legacyCasterTaxBlurb = <div className={"paragraph"} style={{color: warningColor}}>{excerpt}<Help topic={"legacy-caster-tax"} content={blurb}/></div>;
	return <div>
		{controller.gameConfig.shellVersion < ShellVersion.FpsTax ? legacyCasterTaxBlurb : undefined}
		{localize({en: "Displayed GCD", zh: "游戏内显示的GCD"})}: {gcd}&nbsp;
		{
			controller.gameConfig.shellVersion >= ShellVersion.FpsTax ? <Help topic={"displayedGcd"} content={
				localize({
					en: `Measured average GCD should be ${gcdAfterTax} due to FPS tax`,
					zh: `由于帧率税的影响，测量得到的平均GCD为${gcdAfterTax}`
				})
			}/> : undefined
		}
		{localize({en: "Lucid tick offset ", zh: "醒梦&跳蓝时间差 "})}<Help topic={"lucidTickOffset"} content={lucidOffsetDesc}/>: {lucidTickOffset}
		<br/>{localize({en: "Thunder DoT tick offset ", zh: "跳雷&跳蓝时间差 "})}<Help topic={"thunderTickOffset"} content={thunderOffsetDesc}/>: {thunderTickOffset}
		{procMode===ProcMode.RNG ? undefined : <span style={{color: "mediumpurple"}}><br/>Procs: {procMode}</span>}
		{numOverrides === 0 ? undefined : <span style={{color: "mediumpurple"}}><br/>{numOverrides} resource override(s)</span>}
	</div>
}

// key, rscType, rscInfo
function ResourceOverrideDisplay(props) {
	let str;
	if (props.rscInfo.isCoolDown) {
		str = props.override.type + " full in " + props.override.timeTillFullOrDrop + "s";
	} else {
		str = props.override.type;
		if (props.override.type === ResourceType.LeyLines) str += " (" + (props.override.effectOrTimerEnabled ? "enabled" : "disabled") + ")";
		if (props.override.type === ResourceType.Inspiration) str += " (" + (props.override.effectOrTimerEnabled ? "enabled" : "disabled") + ")";
		if (props.override.type === ResourceType.Enochian) str += " (" + (props.override.effectOrTimerEnabled ? "timer enabled" : "timer disabled") + ")";
		if (props.rscInfo.maxValue > 1) str += " (amount: " + props.override.stacks + ")";
		if (props.rscInfo.maxTimeout >= 0) {
			if (props.override.type === ResourceType.Polyglot) {
				if (props.override.timeTillFullOrDrop > 0) str += " next stack ready in " + props.override.timeTillFullOrDrop + "s";
			} else {
				if (props.override.type !== ResourceType.Enochian || props.override.effectOrTimerEnabled) {
					str += " drops in " + props.override.timeTillFullOrDrop + "s";
				}
			}
		}
	}
	str += " ";
	return <div style={{marginTop: 10, color: "mediumpurple"}}>
		{str}
		<Clickable content="[x]" onClickFn={e=>{ props.deleteFn(props.override.type); }}/>
	</div>;
}

export let updateConfigDisplay = (config)=>{};

// helper that prob won't be used elsewhere
function getTaxPreview(level, baseCastTime, spsStr, fpsStr) {
	let sps = parseFloat(spsStr);
	let fps = parseFloat(fpsStr);
	if (isNaN(sps) || isNaN(fps)) {
		return "n/a";
	}
	let adjustedCastTime = XIVMath.preTaxCastTime(level, sps, baseCastTime, false);
	return (XIVMath.afterFpsTax(fps, adjustedCastTime) - adjustedCastTime + XIVMath.afterFpsTax(fps, FIXED_BASE_CASTER_TAX)).toFixed(3);
}

export class Config extends React.Component {
	constructor(props) {
		super(props);
		this.state = { // NOT DEFAULTS
			stepSize : 0,
			level: LevelSync.lvl100,
			spellSpeed: 0,
			criticalHit: 0,
			directHit: 0,
			determination: 0,
			animationLock: 0,
			fps: 0,
			gcdSkillCorrection: 0,
			timeTillFirstManaTick: 0,
			countdown: 0,
			randomSeed: "",
			procMode: ProcMode.RNG,
			initialResourceOverrides: [],
			/////////
			selectedOverrideResource: ResourceType.Mana,
			overrideTimer: 0,
			overrideStacks: 0,
			overrideEnabled: true,
			/////////
			dirty: false,
			b1TaxPreview: "n/a"
		};

		this.updateTaxPreview = (spsStr, fpsStr) => {
			let b1TaxPreview;
			let sps = parseFloat(spsStr);
			let fps = parseFloat(fpsStr);
			if (!isNaN(fps) && !isNaN(sps)) {
				b1TaxPreview = getTaxPreview(this.state.level, 2.5, sps, fps);
			} else {
				b1TaxPreview = "n/a"
			}
			this.setState({b1TaxPreview: b1TaxPreview});
		}

		this.handleSubmit = (event => {
			if (this.#resourceOverridesAreValid()) {
				let seed = this.state.randomSeed;
				if (seed.length === 0) {
					for (let i = 0; i < 4; i++) {
						seed += Math.floor(Math.random() * 10).toString();
					}
					this.setState({randomSeed: seed});
				}
				let config = {
					level: this.state.level,
					spellSpeed: this.state.spellSpeed,
					criticalHit: this.state.criticalHit,
					directHit: this.state.directHit,
					determination: this.state.determination,
					animationLock: this.state.animationLock,
					fps: this.state.fps,
					gcdSkillCorrection: this.state.gcdSkillCorrection,
					countdown: this.state.countdown,
					timeTillFirstManaTick: this.state.timeTillFirstManaTick,
					randomSeed: seed,
					procMode: this.state.procMode,
					initialResourceOverrides: this.state.initialResourceOverrides // info only
				};
				this.setConfigAndRestart(config);
				this.setState({dirty: false});
				controller.scrollToTime();
			}
			event.preventDefault();
		});

		this.setSpellSpeed = (val => {
			this.setState({spellSpeed: val, dirty: true});
			this.updateTaxPreview(val, this.state.fps);
		});

		this.setLevel = (evt => {
			this.setState({level: evt.target.value, dirty: true});
		});

		this.setCriticalHit = (val => {
			this.setState({criticalHit: val, dirty: true});
		});

		this.setDirectHit = (val => {
			this.setState({directHit: val, dirty: true});
		});

		this.setDetermination = (val => {
			this.setState({determination: val, dirty: true});
		}).bind(this);

		this.setAnimationLock = (val => {
			this.setState({animationLock: val, dirty: true});
		});

		this.setFps = (val => {
			this.setState({fps: val, dirty: true});
			this.updateTaxPreview(this.state.spellSpeed, val);
		});

		this.setGcdSkillCorrection = (val => {
			this.setState({gcdSkillCorrection: val, dirty: true});
		});

		this.setTimeTillFirstManaTick = (val => {
			this.setState({timeTillFirstManaTick: val, dirty: true});
		});

		this.setCountdown = (val => {
			this.setState({countdown: val, dirty: true});
		});

		this.setRandomSeed = (val => {
			this.setState({randomSeed: val, dirty: true});
		});

		this.setProcMode = (evt => {
			this.setState({procMode: evt.target.value, dirty: true});
		});

		this.setOverrideTimer = (val => {
			this.setState({overrideTimer: val})
		});
		this.setOverrideStacks = (val => {
			this.setState({overrideStacks: val})
		});
		this.setOverrideEnabled = (evt => {
			this.setState({overrideEnabled: evt.target.checked})
		});
		this.deleteResourceOverride = (rscType => {
			let overrides = this.state.initialResourceOverrides;
			for (let i = 0; i < overrides.length; i++) {
				if (overrides[i].type === rscType) {
					overrides.splice(i, 1);
					break;
				}
			}
			this.setState({initialResourceOverrides: overrides, dirty: true});
		});
	}

	// call this whenever the list of options has potentially changed
	#getFirstAddable(overridesList) {
		let firstAddableRsc = "aba aba";
		let S = new Set();
		overridesList.forEach(ov=>{
			S.add(ov.type);
		});
		for (let k of resourceInfos.keys()) {
			if (!S.has(k)) {
				firstAddableRsc = k;
				break;
			}
		}
		return firstAddableRsc;
	}

	componentDidMount() {
		updateConfigDisplay = ((config)=>{
			this.setState(config);
			this.setState({
				dirty: false,
				b1TaxPreview: getTaxPreview(config.level, 2.5, config.spellSpeed, config.fps),
				selectedOverrideResource: this.#getFirstAddable(config.initialResourceOverrides)
			});
		});
	}

	#resourceOverridesAreValid() {

		// gather resources for quick access
		let M = new Map();
		this.state.initialResourceOverrides.forEach(ov=> {
			M.set(ov.type, ov);
		});

		// shouldn't have AF and UI at the same time
		if (M.has(ResourceType.AstralFire) && M.has(ResourceType.UmbralIce)) {
			let af = M.get(ResourceType.AstralFire).stacks;
			let ui = M.get(ResourceType.UmbralIce).stacks;
			if (af > 0 && ui > 0) {
				window.alert("shouldn't have both AF and UI stacks");
				return false;
			}
		}

		let af = 0;
		let ui = 0;
		let uh = 0;
		if (M.has(ResourceType.AstralFire)) af = M.get(ResourceType.AstralFire).stacks;
		if (M.has(ResourceType.UmbralIce)) ui = M.get(ResourceType.UmbralIce).stacks;
		if (M.has(ResourceType.UmbralHeart)) uh = M.get(ResourceType.UmbralHeart).stacks;

		// if there's uh, must have AF/UI
		if (uh > 0) {
			if (af === 0 && ui === 0) {
				window.alert("since there's at least one UH stack, there should also be Enochian and AF or UI");
				return false;
			}
		}

		// if there are AF/UI stacks, must have enochian
		if (af > 0 || ui > 0 || uh > 0) {
			if (!M.has(ResourceType.Enochian)) {
				window.alert("since there's at least one AF/UI stack, there should also be an Enochian timer");
				return false;
			}
		}

		// vice versa: if there's enochian, must have AF/UI
		if (M.has(ResourceType.Enochian)) {
			if (af === 0 && ui === 0) {
				window.alert("since there's enochian, there should be at least one AF/UI stack");
				return false;
			}
			// if enochian drop halted, must be in ui and have timer at 15s
			let enochian = M.get(ResourceType.Enochian);
			if (!enochian.effectOrTimerEnabled) {
				if (enochian.timeTillFullOrDrop < 15) {
					window.alert("Because the only way to disable Enochian timer (Umbral Soul) also refreshes Enochian, remaining time must be 15 when timer is disabled");
					return false;
				}
				if (ui === 0) {
					window.alert("Enochian timer can only be disabled when in Umbral Ice (the only skill that does this is Umbral Soul)");
					return false;
				}
			}
		}

		// if polyglot timer is set (>0), must have enochian
		if (M.has(ResourceType.Polyglot)) {
			let polyTimer = M.get(ResourceType.Polyglot).timeTillFullOrDrop;
			if (polyTimer > 0 && !M.has(ResourceType.Enochian)) {
				window.alert("since a timer for polyglot is set (time till next stack > 0), there must also be Enochian");
				return false;
			}
		}

		return true;
	}

	#addResourceOverride() {
		let rscType = this.state.selectedOverrideResource;
		let info = resourceInfos.get(rscType);

		let inputOverrideTimer = parseFloat(this.state.overrideTimer);
		let inputOverrideStacks = parseInt(this.state.overrideStacks);
		let inputOverrideEnabled = this.state.overrideEnabled;

		// an exception for polyglot: leave empty := no timer set
		if (rscType === ResourceType.Polyglot && this.state.overrideTimer === "") {
			inputOverrideTimer = 0;
		}

		if (isNaN(inputOverrideStacks) || isNaN(inputOverrideTimer)) {
			window.alert("some inputs are not numbers!");
			return;
		}

		let props = {};

		if (info.isCoolDown)
		{
			let maxTimer = info.maxStacks * info.cdPerStack;
			if (inputOverrideTimer < 0 || inputOverrideTimer > maxTimer) {
				window.alert("invalid input timeout (must be in range [0, " + maxTimer + "])");
				return;
			}

			props = {
				type: rscType,
				timeTillFullOrDrop: inputOverrideTimer,
				stacks: info.maxStacks > 1 ? inputOverrideStacks : 1,
				effectOrTimerEnabled: true,
			};
		}
		else
		{
			if ((info.maxValue > 1 && rscType!==ResourceType.Paradox) &&
				(inputOverrideStacks < 0 || inputOverrideStacks > info.maxValue))
			{
				window.alert("invalid input amount (must be in range [0, " + info.maxValue + "])");
				return;
			}
			if (info.maxTimeout >= 0 &&
				(inputOverrideTimer < 0 || inputOverrideTimer > info.maxTimeout))
			{
				window.alert("invalid input timeout (must be in range [0, " + info.maxTimeout + "])");
				return;
			}

			props = {
				type: rscType,
				timeTillFullOrDrop: info.maxTimeout >= 0 ? inputOverrideTimer : -1,
				stacks: info.maxValue > 1 ? inputOverrideStacks : 1,
				effectOrTimerEnabled: (rscType === ResourceType.LeyLines || rscType === ResourceType.Enochian) ?
					inputOverrideEnabled : true,
			};
		}
		// end validation

		let overrides = this.state.initialResourceOverrides;
		overrides.push(props);
		this.setState({initialResourceOverrides: overrides, dirty: true});
	}

	#addResourceOverrideNode() {
		let resourceOptions = [];
		let S = new Set();
		this.state.initialResourceOverrides.forEach(override=>{
			S.add(override.type);
		});

		let counter = 0;
		for (let k of resourceInfos.keys()) {
			if (!S.has(k)) {
				resourceOptions.push(<option key={counter} value={k}>{k}</option>);
				counter++;
			}
		}

		let rscType = this.state.selectedOverrideResource;
		let info = resourceInfos.get(rscType);
		let inputSection = undefined;
		if (info !== undefined) {

			let showTimer, showAmount, showEnabled;
			let timerDefaultValue = "-1", timerOnChange = undefined;
			let amountDefaultValue = "0", amountOnChange = undefined;

			if (info.isCoolDown) {
				showTimer = true; showAmount = false; showEnabled = false;
				timerDefaultValue = this.state.overrideTimer;
				timerOnChange = this.setOverrideTimer;
			} else {
				// timer
				if (info.maxTimeout >= 0) {
					showTimer = true;
					timerDefaultValue = this.state.overrideTimer;
					timerOnChange = this.setOverrideTimer;
				} else {
					showTimer = false;
				}

				// amount
				if (info.maxValue > 1) {
					showAmount = true;
					amountDefaultValue = this.state.overrideStacks;
					amountOnChange = this.setOverrideStacks;
				} else {
					showAmount = false;
				}

				// enabled
				showEnabled = (rscType === ResourceType.LeyLines || rscType === ResourceType.Enochian);
			}

			let timerDesc;
			if (info.isCoolDown) timerDesc = "Time till full: ";
			else if (rscType === ResourceType.Polyglot) timerDesc = "Time till next stack: ";
			else timerDesc = "Time till drop: ";

			let enabledDesc = "enabled";
			if (rscType === ResourceType.Enochian) enabledDesc = "timer enabled";

			inputSection = <div style={{margin: "6px 0"}}>

				{/*timer*/}
				<div hidden={!showTimer}>
					<Input description={timerDesc}
						   defaultValue={timerDefaultValue}
						   onChange={timerOnChange}/>
				</div>

				{/*stacks*/}
				<div hidden={!showAmount}>
					<Input description="Amount: "
						   defaultValue={amountDefaultValue}
						   onChange={amountOnChange}/>
				</div>

				{/*enabled*/}
				<div hidden={!showEnabled}>
					<input style={{position: "relative", top: 3, marginRight: 5}}
						   type="checkbox"
						   checked={this.state.overrideEnabled}
						   onChange={this.setOverrideEnabled}
					/><span>{enabledDesc}</span>
				</div>

			</div>

		}

		return <form
			onSubmit={evt => {
				this.#addResourceOverride();
				this.setState({
					selectedOverrideResource: this.#getFirstAddable(this.state.initialResourceOverrides)
				});
				evt.preventDefault();
			}}
			style={{marginTop: 16, outline: "1px solid " + getCurrentThemeColors().bgMediumContrast, outlineOffset: 6}}>
			<select value={this.state.selectedOverrideResource}
					onChange={evt => {
						if (evt.target) {
							this.setState({
								selectedOverrideResource: evt.target.value,
								overrideEnabled: evt.target.value===ResourceType.LeyLines ?
									this.state.overrideEnabled : true
							});
						}
					}}>
				{resourceOptions}
			</select>
			{inputSection}
			<input type="submit" value="add override"/>
		</form>
	}

	#resourceOverridesSection() {
		return <div></div>;
		
		let resourceOverridesDisplayNodes = [];
		for (let i = 0; i < this.state.initialResourceOverrides.length; i++) {
			let override = this.state.initialResourceOverrides[i];
			let info = resourceInfos.get(override.type);
			resourceOverridesDisplayNodes.push(<ResourceOverrideDisplay
				key={i}
				override={override}
				rscInfo={info}
				deleteFn={this.deleteResourceOverride}
			/>);
		}
		return <div style={{marginTop: 10}}>
			<Expandable title="overrideInitialResources" titleNode={<span>
				Override initial resources <Help topic="overrideInitialResources"content={<div>
				<div className={"paragraph"} style={{color: "orangered"}}><b>Can create invalid game states. Go over Instructions/Troubleshoot first and use carefully at your own risk!</b></div>
				<div className={"paragraph"}>Also, currently thunder dot buff created this way doesn't actually tick. It just shows the remaining buff timer.</div>
				<div className={"paragraph"}>I would recommend saving settings (stats, lines presets, timeline markers etc.) to files first, in case invalid game states really mess up the tool and a complete reset is required.</div>
			</div>}/>
			</span>} content={<div>
				<button onClick={evt=>{
					this.setState({ initialResourceOverrides: [], dirty: true });
					evt.preventDefault();
				}}>clear all overrides</button>
				{resourceOverridesDisplayNodes}
				{this.#addResourceOverrideNode()}
			</div>}/>
		</div>;
	}

	setConfigAndRestart(config) {
		if (isNaN(parseFloat(config.spellSpeed)) ||
			isNaN(parseFloat(config.criticalHit)) ||
			isNaN(parseFloat(config.directHit)) ||
			isNaN(parseFloat(config.determination)) ||
			isNaN(parseFloat(config.animationLock)) ||
			isNaN(parseFloat(config.fps)) ||
			isNaN(parseFloat(config.gcdSkillCorrection)) ||
			isNaN(parseFloat(config.timeTillFirstManaTick)) ||
			isNaN(parseFloat(config.countdown)) ||
			isNaN(parseFloat(config.level))) {
			window.alert("Some config fields are not numbers!");
			return;
		}
		if (config.initialResourceOverrides === undefined) {
			config.initialResourceOverrides = [];
		}
		controller.setConfigAndRestart({
			level: parseFloat(config.level),
			spellSpeed: parseFloat(config.spellSpeed),
			criticalHit: parseFloat(config.criticalHit),
			directHit: parseFloat(config.directHit),
			determination: parseFloat(config.determination),
			animationLock: parseFloat(config.animationLock),
			fps: parseFloat(config.fps),
			gcdSkillCorrection: parseFloat(config.gcdSkillCorrection),
			timeTillFirstManaTick: parseFloat(config.timeTillFirstManaTick),
			countdown: parseFloat(config.countdown),
			randomSeed: config.randomSeed.trim(),
			procMode: config.procMode,
			initialResourceOverrides: config.initialResourceOverrides // info only
		});
		controller.updateAllDisplay();
	}

	componentWillUnmount() {
		updateConfigDisplay = (config)=>{};
	}

	render() {
		let colors = getCurrentThemeColors();
		let fpsAndCorrectionColor = this.state.shellVersion >= ShellVersion.FpsTax ? colors.text : colors.warning;
		let b1TaxDesc = <div>
			<style>{tableStyle}</style>
			<div className={"paragraph"}>{localize({
				en: "Preview numbers based on your current spell speed and FPS input:",
				zh: "根据当前输入的咏速和帧率，你将得到如下读条+帧率税："
			})}</div>
			<table>
				<tbody>
				<tr>
					<th>{localize({en: "Base cast time", zh: "基础读条时间"})}</th>
					<th>{localize({en: "Caster + FPS tax", zh: "读条税+帧率税"})}</th>
				</tr>
				<tr>
					<td>2.5</td>
					<td>{this.state.b1TaxPreview}</td>
				</tr>
				<tr>
					<td>2.8</td>
					<td>{getTaxPreview(this.state.level, 2.8, this.state.spellSpeed, this.state.fps)}</td>
				</tr>
				<tr>
					<td>3.0</td>
					<td>{getTaxPreview(this.state.level, 3.0, this.state.spellSpeed, this.state.fps)}</td>
				</tr>
				<tr>
					<td>3.5</td>
					<td>{getTaxPreview(this.state.level, 3.5, this.state.spellSpeed, this.state.fps)}</td>
				</tr>
				<tr>
					<td>4.0</td>
					<td>{getTaxPreview(this.state.level, 4.0, this.state.spellSpeed, this.state.fps)}</td>
				</tr>
				</tbody>
			</table>
		</div>
		let editSection = <div>
			<div>
				<span>{localize({en: "level: ", zh: "等级："})}</span>
				<select style={{outline: "none"}} value={this.state.level} onChange={this.setLevel}>
					<option key={LevelSync.lvl100} value={LevelSync.lvl100}>100</option>
					<option key={LevelSync.lvl90} value={LevelSync.lvl90}>90</option>
					<option key={LevelSync.lvl80} value={LevelSync.lvl80}>80</option>
					<option key={LevelSync.lvl70} value={LevelSync.lvl70}>70</option>
				</select>
			</div>
			<Input defaultValue={this.state.spellSpeed} description={localize({en: "spell speed: " , zh: "咏速："})} onChange={this.setSpellSpeed}/>
			<Input defaultValue={this.state.criticalHit} description={localize({en: "crit: " , zh: "暴击："})} onChange={this.setCriticalHit}/>
			<Input defaultValue={this.state.directHit} description={localize({en: "direct hit: " , zh: "直击："})} onChange={this.setDirectHit}/>
			<Input defaultValue={this.state.determination} description={localize({en: "determination: " , zh: "det:"})} onChange={this.setDetermination}/>
			<Input defaultValue={this.state.animationLock} description={localize({en: "animation lock: ", zh: "能力技后摇："})} onChange={this.setAnimationLock}/>
			<div>
				<Input style={{display: "inline-block", color: fpsAndCorrectionColor}} defaultValue={this.state.fps} description={localize({en: "FPS: ", zh: "帧率："})} onChange={this.setFps}/>
				<span> ({localize({en: "B1 tax", zh: "冰1税"})}: {this.state.b1TaxPreview} <Help topic={"b1TaxPreview"} content={b1TaxDesc}/>)</span>
			</div>
			<Input
				style={{color: fpsAndCorrectionColor}}
				defaultValue={this.state.gcdSkillCorrection}
				description={<span>{localize({en: "GCD correction", zh: "GCD时长修正"})} <Help topic={"cast-time-correction"} content={localize({
					en: "Leaving this at 0 will probably give you the most accurate simulation. But if you want to manually correct your GCD skill durations (including casts) for whatever reason, you can put a small number (can be negative)",
					zh: "正常情况下填0即能得到最精确的模拟结果。如果实在需要修正的话，这里输入的时长会被加到你的每个GCD技能（包括读条）耗时里（可以为负）"
				})}/>: </span>}
				onChange={this.setGcdSkillCorrection}/>
			<Input defaultValue={this.state.timeTillFirstManaTick} description={localize({en: "time till first MP tick: ", zh: "距首次跳蓝时间："})} onChange={this.setTimeTillFirstManaTick}/>
			<Input defaultValue={this.state.countdown} description={
				<span>{
					localize({en: "countdown ", zh: "倒数时间 "})
				}<Help topic={"countdown"} content={localize({en: "can use a negative countdown to start from a specific time of fight", zh: "可以是负数，时间轴会从战斗中途某个时间开始显示"})}/>: </span>
			} onChange={this.setCountdown}/>
			<Input defaultValue={this.state.randomSeed} description={
				<span>{localize({en: "random seed ", zh: "随机种子 "})}<Help topic={"randomSeed"} content={
					localize({
						en: "can be anything, or leave empty to get 4 random digits.",
						zh: "可以是任意字符串，或者留空，会获得4个随机数字"
					})
				}/>: </span>} onChange={this.setRandomSeed}/>
			<div>
				<span>{localize({en: "proc mode ", zh: "随机BUFF获取 "})}<Help topic={"procMode"} content={
					localize({
						en: "Default RNG: 40% Firestarter",
						zh: "RNG会像游戏内一样，相应技能40%概率获得火苗，Always则每次都会触发火苗，Never则从不触发。"
					})
				}/>: </span>
				<select style={{outline: "none"}} value={this.state.procMode} onChange={this.setProcMode}>
					<option key={ProcMode.RNG} value={ProcMode.RNG}>RNG</option>
					<option key={ProcMode.Never} value={ProcMode.Never}>Never</option>
					<option key={ProcMode.Always} value={ProcMode.Always}>Always</option>
				</select>
			</div>
			{this.#resourceOverridesSection()}
			<button onClick={this.handleSubmit}>{localize({en: "apply and reset", zh: "应用并重置时间轴"})}</button>
		</div>;
		return (
			<div className={"config"} style={{marginBottom: 16}}>
				<div style={{marginBottom: 5}}><b>{localize({en: "Config", zh: "设置"})}</b></div>
				<ConfigSummary/> {/* retrieves data from global controller */}
				<Expandable title={"Edit"} titleNode={localize({en: "Edit", zh: "编辑"}) + (this.state.dirty ? "*" : "")} content={editSection}/>
			</div>
		)}
}