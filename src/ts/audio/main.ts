import {AudioContext} from 'node-web-audio-api'
import {Audiator} from './audio'
const audiator = new Audiator(new AudioContext())
audiator.play()


