namespace feng3d
{
    /**
     * 粒子发射器
     * @author feng 2017-01-09
     */
    export class ParticleEmission extends ParticleComponent
    {
        /**
         * 发射率，每秒发射粒子数量
         */
        @oav()
        @serialize
        rate = 100;

        /**
         * 爆发，在time时刻额外喷射particles粒子
         */
        @oav({ component: "OAVArray", componentParam: { defaultItem: () => { return { time: 0, particles: 30 } } } })
        @serialize
        bursts: { time: number, particles: number }[] = [];

        isDirty = true;

        private _numParticles;

        private _birthTimes: number[];

        constructor()
        {
            super();
        }

        /**
		 * 创建粒子属性
         * @param particle                  粒子
		 */
        generateParticle(particle: Particle, particleSystem: ParticleSystem)
        {
            if (this._numParticles != particleSystem.numParticles)
                this.isDirty = true;
            this._numParticles = particleSystem.numParticles;

            particle.birthTime = this.getBirthTimeArray(particleSystem.numParticles)[particle.index];
        }

        /**
         * 获取出生时间数组
         */
        private getBirthTimeArray(numParticles)
        {
            if (this.isDirty)
            {
                this.isDirty = false;

                var birthTimes: number[] = [];
                var bursts = this.bursts.concat();
                //按时间降序排列
                bursts.sort((a: { time: number; }, b: { time: number; }) => { return b.time - a.time });
                var index = 0;
                var time = 0;//以秒为单位
                var i = 0;
                var timeStep = 1 / this.rate;
                while (index < numParticles)
                {
                    while (bursts.length > 0 && bursts[bursts.length - 1].time <= time)
                    {
                        var burst = bursts.pop();
                        if (burst)
                        {
                            for (i = 0; i < burst.particles; i++)
                            {
                                birthTimes[index++] = burst.time;
                            }
                        }
                    }

                    birthTimes[index++] = time;
                    time += timeStep;
                }
                this._birthTimes = birthTimes;
            }

            return this._birthTimes;
        }
    }
}