#!/usr/bin/env node

import chalk from "chalk"
import fs from "fs"
import { Command } from "commander"
import childProcess from "child_process"
import ora from "ora"
import { execa, execaCommand } from "execa"
import {input} from "@inquirer/prompts"
import path from "path"

const program = new Command()
const green = chalk.green

const isBunInstalled = () => {
    try {
        childProcess.execSync('bun --version')
        return true
    }
    catch {
        return false
    }
}

const isYarnInstalled = () => {
    try {
        childProcess.execSync('yarn --version')
        return true
    }
    catch {
        return false
    }
}

(async () => {
    const spinner = ora({
        text: "Creating stack"
    })

    try {
        const regex = /^([a-z]+)(-[a-z0-9]+)*$/
        
        program
            .name('Create Cloudflare stack')
            .description('Create cloudflare stack with one command')

        program.parse(process.argv)

        const args = process.args
        let appName = args

        if (!appName || !regex.test(args)) {
            appName = await input({
                message: 'Enter your app name',
                default: 'amazing-cloudflare-app',
                validate: name => {
                    if (!regex.test(name)) {
                        return 'Please enter your app name in amazing-cloudflare-app'
                    }
                    return true
                } 
            })
        }

        let repoUrl = "https://github.com/Dhravya/cloudflare-saas-stack"

        spinner.start()

        await execa('git', ['clone', repoUrl, appName])
        let packageFile = fs.readFileSync(`${appName}/package.json`, 'utf-8')
        const packageObj = JSON.parse(packageFile)
        packageObj.name = appName
        packageFile = JSON.stringify(packageObj, null, 2)
        fs.writeFileSync(`${appName}/package.json`, packageFile)

        process.chdir(path.join(process.cwd(), appName))
        spinner.text = ' '
        let startCommand = ' '

        if (isBunInstalled()) {
            spinner.text = 'Installing dependencies '
            await execaCommand('bun install', {stdout: 'inherit'})
            spinner.text = ' '
            startCommand = 'bun dev'
            console.log("\n")
        }

        else if (isYarnInstalled()) {
            await execaCommand('yarn', {stdio: 'inherit'})
            startCommand = 'yarn dev'
        }

        else {
            spinner.text = 'Installing dependencies'
            await execa('npm', ['install', '--verbose'], {stdio: 'inherit'})
            spinner.text = ''
            startCommand = 'npm run dev'
        }

        spinner.stop()
        console.log(`${green.bold('Success!')} Created ${appName} at ${process.cwd()} \n`)
        console.log(`To get started, change into the new directory and  run ${chalk.blueBright(startCommand)}`)
    }
    catch(err) {
        console.log("\n")
        if (err) {
         console.log("Error Occurred :(");
         console.error(err)
        }
        spinner.stop()
    }
})()