import {AudioContext} from 'node-web-audio-api'
import {Audiator} from './audiator'
const audiator = new Audiator(new AudioContext())
audiator.play()


