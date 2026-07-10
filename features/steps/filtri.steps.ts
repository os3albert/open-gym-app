import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from 'chai'
import { applyFilters, suitabilityRequiresStature } from '../../src/domain/filters'
import { setStature } from '../../src/domain/profile'
import type { GymWorld } from '../support/world'

Given('che la mia statura è di {int} cm', function (this: GymWorld, statureCm: number) {
  this.data = setStature(this.data, statureCm)
})

Given('che non ho impostato la mia statura', function (this: GymWorld) {
  this.data = { ...this.data, profile: { ...this.data.profile, statureCm: null } }
})

When('attivo il filtro {string}', function (this: GymWorld, _label: string) {
  this.filters = { ...this.filters, suitableOnly: true }
})

When('ordino gli esercizi per più votati', function (this: GymWorld) {
  this.filters = { ...this.filters, sort: 'votes' }
})

Then("l'unico esercizio visibile è {string}", function (this: GymWorld, name: string) {
  const visible = applyFilters(this.data, this.filters).map((e) => e.name)
  expect(visible).to.deep.equal([name])
})

Then(
  "vedo gli esercizi nell'ordine {string}, {string}",
  function (this: GymWorld, first: string, second: string) {
    const visible = applyFilters(this.data, this.filters).map((e) => e.name)
    expect(visible).to.deep.equal([first, second])
  },
)

Then('mi viene chiesto di inserire la mia statura', function (this: GymWorld) {
  expect(suitabilityRequiresStature(this.filters, this.data)).to.equal(true)
})
