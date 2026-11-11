export interface NepriatelApi {
  znic(): void
}

export type AkciaCheatu = () => void
export type AkciaMince = () => void
export type AkciaNepriatela = (zhora: boolean, nepriatel: NepriatelApi) => void

export interface Hacik<F> {
  /** napr. "priZbereMince" alebo `cheat("baguvix")` */
  readonly nazov: string
  readonly akcia: F
  /** po chybe sa háčik vypne až do ďalšieho spustenia kódu */
  vypnuty: boolean
}

export interface CheatHacik extends Hacik<AkciaCheatu> {
  readonly kod: string
}

/** Všetky háčiky jedného behu študentského kódu. Pri novom behu sa zahodí celý. */
export class Register {
  readonly cheaty: CheatHacik[] = []
  readonly mince: Hacik<AkciaMince>[] = []
  readonly nepriatelia: Hacik<AkciaNepriatela>[] = []

  get pocet(): number {
    return this.cheaty.length + this.mince.length + this.nepriatelia.length
  }
}
