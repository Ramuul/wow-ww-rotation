import {Aspect, BuffType, ProcMode, ResourceType, SkillName, WarningType} from './Common'
// @ts-ignore
import {controller} from "../Controller/Controller";
import {DoTBuff, EventTag, Resource} from "./Resources";
import {ActionNode} from "../Controller/Record";
import {GameState} from "./GameState";
import {getPotencyModifiersFromResourceState, Potency} from "./Potency";

export interface SkillCaptureCallbackInfo {
	capturedManaCost: number
}

export interface SkillApplicationCallbackInfo {

}

export class SkillInfo {
	readonly name: SkillName;
	readonly cdName: ResourceType;
	readonly aspect: Aspect;
	readonly isSpell: boolean;
	readonly baseCastTime: number;
	readonly baseRecastTime: number;
	readonly baseManaCost: number;
	readonly basePotency: number;
	readonly skillApplicationDelay: number;

	constructor(
		skillName: SkillName,
		cdName: ResourceType,
		aspect: Aspect,
		isSpell: boolean,
		baseCastTime: number,
		baseManaCost: number,
		basePotency: number,
		skillApplicationDelay?: number,
		baseRecastTime?: number,
		)
	{
		this.name = skillName;
		this.cdName = cdName;
		this.aspect = aspect;
		this.isSpell = isSpell;
		this.baseCastTime = baseCastTime;
		this.baseRecastTime = baseRecastTime ?? 2.5;
		this.baseManaCost = baseManaCost;
		this.basePotency = basePotency;
		this.skillApplicationDelay = skillApplicationDelay===undefined ? 0 : skillApplicationDelay;
	}
}

// ref logs
// https://www.fflogs.com/reports/KVgxmW9fC26qhNGt#fight=16&type=summary&view=events&source=6
// https://www.fflogs.com/reports/rK87bvMFN2R3Hqpy#fight=1&type=casts&source=7
// https://www.fflogs.com/reports/cNpjtRXHhZ8Az2V3#fight=last&type=damage-done&view=events&ability=36987
// https://www.fflogs.com/reports/7NMQkxLzcbptw3Xd#fight=15&type=damage-done&source=116&view=events&ability=36986
const skillInfos = [
	new SkillInfo(SkillName.Addle, ResourceType.cd_Addle, Aspect.Other, false,
		0, 0, 0, 0.621),// delayed
	new SkillInfo(SkillName.Swiftcast, ResourceType.cd_Swiftcast, Aspect.Other, false,
		0, 0, 0), // instant
	new SkillInfo(SkillName.LucidDreaming, ResourceType.cd_LucidDreaming, Aspect.Other, false,
		0, 0, 0, 0.623), // delayed
	new SkillInfo(SkillName.Surecast, ResourceType.cd_Surecast, Aspect.Other, false,
		0, 0, 0), // surprisingly instant because arms length is not
	new SkillInfo(SkillName.Tincture, ResourceType.cd_Tincture, Aspect.Other, false,
		0, 0, 0, 0.891),// delayed
	new SkillInfo(SkillName.Sprint, ResourceType.cd_Sprint, Aspect.Other, false,
		0, 0, 0, 0.133), // delayed

	// TODO get 3rd digit of precision
	// https://docs.google.com/spreadsheets/d/1Emevsz5_oJdmkXy23hZQUXimirZQaoo5BejSzL3hZ9I/edit?gid=543259752#gid=543259752
	new SkillInfo(SkillName.FireInRed, ResourceType.cd_GCD, Aspect.Other, true,
		1.5, 300, 440, 0.84),
	new SkillInfo(SkillName.AeroInGreen, ResourceType.cd_GCD, Aspect.Other, true,
		1.5, 300, 480, 0.01),
	new SkillInfo(SkillName.TemperaCoat, ResourceType.cd_TemperaCoat, Aspect.Other, false,
		0, 0, 0, 0.01),// delayed
	new SkillInfo(SkillName.WaterInBlue, ResourceType.cd_GCD, Aspect.Other, true,
		1.5, 300, 520, 0.01),
	new SkillInfo(SkillName.Smudge, ResourceType.cd_Smudge, Aspect.Other, false,
		0, 0, 0, 0.01),// delayed
	new SkillInfo(SkillName.Fire2InRed, ResourceType.cd_GCD, Aspect.Other, true,
		1.5, 300, 120, 0.01),
	new SkillInfo(SkillName.CreatureMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.01, 4),
	new SkillInfo(SkillName.LivingMuse, ResourceType.cd_LivingMuse, Aspect.Other, false,
		0, 0, 0, 0.01),
	new SkillInfo(SkillName.MogOfTheAges, ResourceType.cd_Portrait, Aspect.Other, false,
		0, 0, 1300, 0.01),
	new SkillInfo(SkillName.PomMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.WingMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.PomMuse, ResourceType.cd_LivingMuse, Aspect.Other, false,
		0, 0, 1100, 0.01),
	new SkillInfo(SkillName.WingedMuse, ResourceType.cd_LivingMuse, Aspect.Other, false,
		0, 0, 1100, 0.01),
	new SkillInfo(SkillName.Aero2InGreen, ResourceType.cd_GCD, Aspect.Other, true,
		1.5, 300, 140, 0.01),
	new SkillInfo(SkillName.Water2InBlue, ResourceType.cd_GCD, Aspect.Other, true,
		1.5, 300, 160, 0.01),
	new SkillInfo(SkillName.WeaponMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.SteelMuse, ResourceType.cd_SteelMuse, Aspect.Other, false,
		0, 0, 0, 0.01),
	new SkillInfo(SkillName.HammerMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.StrikingMuse, ResourceType.cd_SteelMuse, Aspect.Other, false,
		0, 0, 0, 0.01),
	new SkillInfo(SkillName.BlizzardInCyan, ResourceType.cd_GCD, Aspect.Other, true,
		2.3, 400, 800, 0.01, 3.3),
	new SkillInfo(SkillName.Blizzard2InCyan, ResourceType.cd_GCD, Aspect.Other, true,
		2.3, 400, 240, 0.01, 3.3),
	new SkillInfo(SkillName.SubtractivePalette, ResourceType.cd_Subtractive, Aspect.Other, false,
		0, 0, 0, 0.00),
	new SkillInfo(SkillName.StoneInYellow, ResourceType.cd_GCD, Aspect.Other, true,
		2.3, 400, 840, 0.01, 3.3),
	new SkillInfo(SkillName.Stone2InYellow, ResourceType.cd_GCD, Aspect.Other, true,
		2.3, 400, 260, 0.01, 3.3),
	new SkillInfo(SkillName.ThunderInMagenta, ResourceType.cd_GCD, Aspect.Other, true,
		2.3, 400, 880, 0.01, 3.3),
	new SkillInfo(SkillName.Thunder2InMagenta, ResourceType.cd_GCD, Aspect.Other, true,
		2.3, 400, 280, 0.01, 3.3),
	new SkillInfo(SkillName.LandscapeMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.ScenicMuse, ResourceType.cd_ScenicMuse, Aspect.Other, false,
		0, 0, 0, 0.01),
	new SkillInfo(SkillName.StarrySkyMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.StarryMuse, ResourceType.cd_ScenicMuse, Aspect.Other, false,
		0, 0, 0, 0.01),
	new SkillInfo(SkillName.HolyInWhite, ResourceType.cd_GCD, Aspect.Other, true,
		0, 300, 520, 0.01),
	new SkillInfo(SkillName.HammerStamp, ResourceType.cd_GCD, Aspect.Other, true,
		0, 300, 560, 0.01),
	new SkillInfo(SkillName.HammerBrush, ResourceType.cd_GCD, Aspect.Other, true,
		0, 300, 620, 0.01),
	new SkillInfo(SkillName.PolishingHammer, ResourceType.cd_GCD, Aspect.Other, true,
		0, 300, 680, 0.01),
	new SkillInfo(SkillName.TemperaGrassa, ResourceType.cd_Grassa, Aspect.Other, false,
		0, 0, 0, 0.01),
	new SkillInfo(SkillName.CometInBlack, ResourceType.cd_GCD, Aspect.Other, true,
		0, 400, 880, 0.01, 3.3),
	new SkillInfo(SkillName.RainbowDrip, ResourceType.cd_GCD, Aspect.Other, true,
		4, 400, 1000, 0.01, 6),
	new SkillInfo(SkillName.ClawMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.ClawedMuse, ResourceType.cd_LivingMuse, Aspect.Other, false,
		0, 0, 1100, 0.01),
	new SkillInfo(SkillName.MawMotif, ResourceType.cd_GCD, Aspect.Other, true,
		3, 0, 0, 0.00, 4),
	new SkillInfo(SkillName.FangedMuse, ResourceType.cd_LivingMuse, Aspect.Other, false,
		0, 0, 1100, 0.01),
	new SkillInfo(SkillName.RetributionOfTheMadeen, ResourceType.cd_Portrait, Aspect.Other, false,
		0, 0, 1400, 0.01),
	new SkillInfo(SkillName.StarPrism, ResourceType.cd_GCD, Aspect.Other, true,
		0, 0, 0, 0.00),
];

const skillInfosMap: Map<SkillName, SkillInfo> = new Map();
skillInfos.forEach(info=>{
	skillInfosMap.set(info.name, info);
});

export class Skill {
	readonly name: SkillName;
	readonly available: () => boolean;
	readonly use: (game: GameState, node: ActionNode) => void;
	info: SkillInfo;

	constructor(name: SkillName, requirementFn: ()=>boolean, effectFn: (game: GameState, node: ActionNode)=>void) {
		this.name = name;
		this.available = requirementFn;
		this.use = effectFn;
		let info = skillInfosMap.get(name);
		if (!info) {
			info = skillInfos[0];
			console.error("Skill info not found!");
		}
		this.info = info;
	}
}

export class SkillsList extends Map<SkillName, Skill> {
	constructor(game: GameState) {
		super();

		let skillsList = this;

		let addResourceAbility = function(props: {
			skillName: SkillName,
			rscType: ResourceType,
			instant: boolean,
			duration: number,
			additionalEffect?: () => void
		}) {
			let takeEffect = (node: ActionNode) => {
				let resource = game.resources.get(props.rscType);
				if (resource.available(1)) {
					resource.overrideTimer(game, props.duration);
				} else {
					resource.gain(1);
					game.resources.addResourceEvent({
						rscType: props.rscType,
						name: "drop " + props.rscType,
						delay: props.duration,
						fnOnRsc: (rsc: Resource) => {
							rsc.consume(1);
						}
					});
				}
				node.resolveAll(game.getDisplayTime());
				if (props.additionalEffect) {
					props.additionalEffect();
				}
			};
			skillsList.set(props.skillName, new Skill(props.skillName,
				() => {
					return true;
				},
				(game, node) => {
					game.useInstantSkill({
						skillName: props.skillName,
						onCapture: props.instant ? ()=>takeEffect(node) : undefined,
						onApplication: props.instant ? undefined : ()=>takeEffect(node),
						dealDamage: false,
						node: node
					});
				}
			));
		}

		// Basic filler
		let addBasicFiller = function(skillName: SkillName) {
			skillsList.set(skillName, new Skill(skillName,
				() => {
					if (game.resources.get(ResourceType.SubtractivePalette).available(1)) {
						return false;
					}
					let aetherhueCount = game.resources.get(ResourceType.Aetherhues).availableAmount();
					switch (aetherhueCount) {
						case 0: return skillName.includes("Fire");
						case 1: return skillName.includes("Aero");
						default: return skillName.includes("Water");
					}
				},
				(game: GameState, node: ActionNode) => {
					game.castSpell({
						skillName: skillName,
						// TODO check if this happens on cast or on application
						onCapture: (cap: SkillCaptureCallbackInfo) => {
							game.cycleAetherhues();
							game.tryConsumeHyperphantasia();
							if (skillName === SkillName.WaterInBlue
								|| skillName === SkillName.Water2InBlue) {
								if (game.resources.get(ResourceType.PaletteGauge).available(100)) {
									controller.reportWarning(WarningType.PaletteOvercap);
								}
								game.resources.get(ResourceType.PaletteGauge).gain(25);
								game.resources.get(ResourceType.Paint).gain(1);
							}
						},
						onApplication: (app: SkillApplicationCallbackInfo) => {},
						node: node,
					});
				}
			));
		};

		// Subtractive spells
		let addSubtractiveFiller = function(skillName: SkillName) {
			skillsList.set(skillName, new Skill(skillName,
				() => {
					if (!game.resources.get(ResourceType.SubtractivePalette).available(1)) {
						return false;
					}
					let aetherhueCount = game.resources.get(ResourceType.Aetherhues).availableAmount();
					switch (aetherhueCount) {
						case 0: return skillName.includes("Blizzard");
						case 1: return skillName.includes("Stone");
						default: return skillName.includes("Thunder");
					}
				},
				(game: GameState, node: ActionNode) => {
					game.castSpell({
						skillName: skillName,
						// TODO check if this happens on cast or on application
						onCapture: (cap: SkillCaptureCallbackInfo) => {
							game.cycleAetherhues();
							game.resources.get(ResourceType.SubtractivePalette).consume(1);
							game.tryConsumeHyperphantasia();
							if (skillName === SkillName.ThunderInMagenta
								|| skillName === SkillName.Thunder2InMagenta) {
								game.resources.get(ResourceType.Paint).gain(1);
							}
						},
						onApplication: (app: SkillApplicationCallbackInfo) => {},
						node: node,
					});
				}
			));
		};

		[
			SkillName.FireInRed, SkillName.Fire2InRed,
			SkillName.AeroInGreen, SkillName.Aero2InGreen,
			SkillName.WaterInBlue, SkillName.Water2InBlue,
		].forEach(addBasicFiller);
		[
			SkillName.BlizzardInCyan, SkillName.Blizzard2InCyan,
			SkillName.StoneInYellow, SkillName.Stone2InYellow,
			SkillName.ThunderInMagenta, SkillName.Thunder2InMagenta,
		].forEach(addSubtractiveFiller);

		// Subtractive Palette
		skillsList.set(SkillName.SubtractivePalette, new Skill(SkillName.SubtractivePalette,
			() => (
				// Check we are not already in subtractive
				!game.resources.get(ResourceType.SubtractivePalette).available(1) &&
				// Check if free subtractive from starry muse or 50 gauge is available
				(
					game.resources.get(ResourceType.SubtractiveSpectrum).available(1) ||
					game.resources.get(ResourceType.PaletteGauge).available(50)
				)
			),
			(game: GameState, node: ActionNode) => {
				game.useInstantSkill({
					skillName: SkillName.SubtractivePalette,
					onCapture: () => {
						let subtractiveSpectrum = game.resources.get(ResourceType.SubtractiveSpectrum);
						let paletteGauge = game.resources.get(ResourceType.PaletteGauge);
						if (subtractiveSpectrum.available(1)) {
							subtractiveSpectrum.consume(1);
							subtractiveSpectrum.removeTimer();
						} else {
							paletteGauge.consume(50);
						}
						// gain comet (caps at 1)
						if (game.resources.get(ResourceType.MonochromeTones).available(1)) {
							controller.reportWarning(WarningType.CometOverwrite);
						}
						game.resources.get(ResourceType.MonochromeTones).gain(1);
						game.resources.get(ResourceType.SubtractivePalette).gain(3);
					},
					dealDamage: false,
					node: node,
				});
				node.resolveAll(game.getDisplayTime());
			}
		));


		// Holy in White
		skillsList.set(SkillName.HolyInWhite, new Skill(SkillName.HolyInWhite,
			() => game.resources.get(ResourceType.Paint).available(1) && !game.resources.get(ResourceType.MonochromeTones).available(1),
			(game: GameState, node: ActionNode) => {
				game.castSpell({
					skillName: SkillName.HolyInWhite,
					onCapture: (cap: SkillCaptureCallbackInfo) => {
						game.resources.get(ResourceType.Paint).consume(1);
						game.tryConsumeHyperphantasia();
					},
					onApplication: (app: SkillApplicationCallbackInfo) => {},
					node: node,
				})
			}
		));

		// Comet in Black
		skillsList.set(SkillName.CometInBlack, new Skill(SkillName.CometInBlack,
			() => game.resources.get(ResourceType.Paint).available(1) && game.resources.get(ResourceType.MonochromeTones).available(1),
			(game: GameState, node: ActionNode) => {
				game.castSpell({
					skillName: SkillName.CometInBlack,
					onCapture: (cap: SkillCaptureCallbackInfo) => {
						game.resources.get(ResourceType.Paint).consume(1);
						game.resources.get(ResourceType.MonochromeTones).consume(1);
						game.tryConsumeHyperphantasia();
					},
					onApplication: (app: SkillApplicationCallbackInfo) => {},
					node: node,
				})
			}
		));
		
		// Addle
		addResourceAbility({skillName: SkillName.Addle, rscType: ResourceType.Addle, instant: false, duration: 15});

		// Swiftcast
		addResourceAbility({skillName: SkillName.Swiftcast, rscType: ResourceType.Swiftcast, instant: true, duration: 10});

		// Lucid Dreaming
		skillsList.set(SkillName.LucidDreaming, new Skill(SkillName.LucidDreaming,
			() => { return true; },
			(game, node) => {
				game.useInstantSkill({
					skillName: SkillName.LucidDreaming,
					onApplication: () => {
						let lucid = game.resources.get(ResourceType.LucidDreaming) as DoTBuff;
						if (lucid.available(1)) {
							lucid.overrideTimer(game, 21);
						} else {
							lucid.gain(1);
							game.resources.addResourceEvent({
								rscType: ResourceType.LucidDreaming,
								name: "drop lucid dreaming", delay: 21, fnOnRsc: (rsc: Resource) => {
									rsc.consume(1);
								}
							});
						}
						lucid.node = node;
						lucid.tickCount = 0;
						let nextLucidTickEvt = game.findNextQueuedEventByTag(EventTag.LucidTick);
						if (nextLucidTickEvt) {
							nextLucidTickEvt.addTag(EventTag.ManaGain);
						}
					},
					dealDamage: false,
					node: node
				});
				node.resolveAll(game.getDisplayTime());
			}))

		// Surecast
		addResourceAbility({skillName: SkillName.Surecast, rscType: ResourceType.Surecast, instant: true, duration: 6});

		// Tincture
		addResourceAbility({skillName: SkillName.Tincture, rscType: ResourceType.Tincture, instant: false, duration: 30});

		// Sprint
		addResourceAbility({skillName: SkillName.Sprint, rscType: ResourceType.Sprint, instant: false, duration: 10});

		return skillsList;
	}
	get(key: SkillName): Skill {
		let skill = super.get(key);
		if (skill) return skill;
		else {
			console.assert(false);
			return new Skill(
				SkillName.Never,
				()=>{return false},
				(game: GameState, node: ActionNode)=>{});
		}
	}
}